import { randomUUID } from "node:crypto"
import { config } from "../../config.js"
import { AuthRepo } from "./repo.js"
import { logger } from "../../logger.js"
import type { Integration } from "../../models/integration.js"
import { AmoClient } from "../../infra/amo/client.js"
import { GetSourcesResponse } from "../../infra/amo/response/sources.js"
import { Contact } from "../../models/contact.js"
import { SubscribeRequest } from "../../infra/amo/request/webhooks.js"
import { GetContactListParams } from "../../infra/amo/request/contact.js"
import { GetContactListResponse } from "../../infra/amo/response/contact.js"
import { GetLeadsParams } from "../../infra/amo/request/leads.js"
import { GetLeadsResponse } from "../../infra/amo/response/leads.js"
import { Lead } from "../../models/leads.js"
import { withAmoTokenRefresh } from "../../infra/amo/with_token_refresh.js"
import { rowsFromAmoApiCustomFieldsValues } from "../lead_custom_fields/build_rows.js"

export class AuthService {
  constructor(private authRepo: AuthRepo, private amoClient: AmoClient) { }

  async start(): Promise<string> {
    const state = randomUUID()
    const expiredAt = new Date(Date.now() + 10 * 60 * 1000)

    try {
      await this.authRepo.createOauthState({ state, expiredAt, used: false })
    } catch (error) {
      logger.error("AuthService - start - create oauth state", { error: error as Error })
      throw new Error(`AuthService - start - create oauth state: ${error as Error}`)
    }

    const authorizeUrl = new URL(config.AMO_OAUTH_URL)
    authorizeUrl.searchParams.set("client_id", config.AMO_CLIENT_ID)
    authorizeUrl.searchParams.set("state", state)
    authorizeUrl.searchParams.set("mode", "popup")

    logger.debug("AuthService - start - authorize url", { authorizeUrl: authorizeUrl.toString() })
    return authorizeUrl.toString()
  }

  async completeOauth(state: string, code: string, referer: string) {
    try {
      await this.authRepo.consumeOauthState(state)
    } catch (error) {
      logger.error("AuthService - completeOauth - consume oauth state", { error: error as Error })
      throw new Error(`AuthService - completeOauth - consume oauth state: ${error as Error}`)
    }

    let integration: Integration = {
      domain: "",
      accessToken: "",
      refreshToken: "",
      amojoID: "",
      scopeID: "",
      active: true,
    }
    try {
      integration = await this.authRepo.getIntegrationByDomain(referer)
    } catch (e: any) {
      if (e.code === "P2025") {
        integration = {
          domain: "",
          accessToken: "",
          refreshToken: "",
          amojoID: "",
          scopeID: "",
          active: true,
        }
      } else {
        logger.error("AuthService - completeOauth - get integration by domain", { error: e as Error })
        throw new Error(`AuthService - completeOauth - get integration by domain: ${e as Error}`)
      }
    }

    let domain = integration.domain ?? ""
    if (referer !== "") {
      referer = referer.replace("https://", "").replace("http://", "").replace("/", "")

      if (referer.includes(".amocrm.ru") || referer.includes(".amocrm.com")) {
        domain = referer
      }
    }

    try {
      const accessToken = await this.amoClient.auth.getAccessToken(code, domain)

      integration.accessToken = accessToken.access_token
      integration.refreshToken = accessToken.refresh_token
    } catch (error) {
      logger.error("AuthService - completeOauth - get access token", { error: error as Error })
      throw new Error(`AuthService - completeOauth - get access token: ${error as Error}`)
    }

    const amojoID = await withAmoTokenRefresh(
      integration,
      this.authRepo,
      this.amoClient.auth,
      (accessToken) => this.amoClient.account.getAmojoID(domain, accessToken)
    )

    integration.amojoID = amojoID

    try {
      const scopeID = await this.amoClient.chat.connectChatChannel(integration.amojoID)
      integration.scopeID = scopeID
    } catch (error) {
      logger.error("AuthService - completeOauth - connect chat channel", { error: error as Error })
      throw new Error(`AuthService - completeOauth - connect chat channel: ${error as Error}`)
    }

    try {
      await this.authRepo.upsertIntegration(integration)
    } catch (error) {
      logger.error("AuthService - completeOauth - upsert integration", { error: error as Error })
      throw new Error(`AuthService - completeOauth - upsert integration: ${error as Error}`)
    }

    try {
      await this.setupIntegration(integration)
    } catch (error) {
      logger.error("AuthService - completeOauth - setup integration", { error: error as Error })
      throw new Error(`AuthService - completeOauth - setup integration: ${error as Error}`)
    }
  }

  private async setupIntegration(integration: Integration) {
    try {
      await this.subscribeWebhook(integration)
    } catch (error) {
      logger.error("AuthService - completeOauth - subscribe webhook", { error: error as Error })
      throw new Error(`AuthService - completeOauth - subscribe webhook: ${error as Error}`)
    }

    try {
      await this.loadContacts(integration)
    } catch (error) {
      logger.error("AuthService - completeOauth - load contacts", { error: error as Error })
      throw new Error(`AuthService - completeOauth - load contacts: ${error as Error}`)
    }

    try {
      await this.loadLeads(integration)
    } catch (error) {
      logger.error("AuthService - completeOauth - load leads", { error: error as Error })
      throw new Error(`AuthService - completeOauth - load leads: ${error as Error}`)
    }
  }

  private async subscribeWebhook(integration: Integration) {
    const webhookSubscriptions: SubscribeRequest[] = [
      {
        destination: "http://31.129.103.126:8080/api/v1/webhook/contacts/add",
        settings: ["add_contact"],
      },
      {
        destination: "http://31.129.103.126:8080/api/v1/webhook/contacts/update",
        settings: ["update_contact"],
      },
      {
        destination: "http://31.129.103.126:8080/api/v1/webhook/contacts/delete",
        settings: ["delete_contact",],
      },
      {
        destination: "http://31.129.103.126:8080/api/v1/webhook/contacts/restore",
        settings: ["restore_contact"],
      },
      {
        destination: "http://31.129.103.126:8080/api/v1/webhook/leads/add",
        settings: ["add_lead"],
      },
      {
        destination: "http://31.129.103.126:8080/api/v1/webhook/leads/update",
        settings: ["update_lead"],
      },
      {
        destination: "http://31.129.103.126:8080/api/v1/webhook/leads/delete",
        settings: ["delete_lead"],
      },
      {
        destination: "http://31.129.103.126:8080/api/v1/webhook/leads/restore",
        settings: ["restore_lead"],
      },
      {
        destination: "http://31.129.103.126:8080/api/v1/webhook/notes/add",
        settings: ["note_lead"],
      },
      {
        destination: "http://31.129.103.126:8080/api/v1/webhook/talks/add",
        settings: ["add_talk"],
      }
    ]

    for (const webhookRequest of webhookSubscriptions) {
      await withAmoTokenRefresh(
        integration,
        this.authRepo,
        this.amoClient.auth,
        (accessToken) => this.amoClient.webhooks.subscribe(integration.domain, accessToken, webhookRequest)
      )
    }
  }

  private async loadContacts(integration: Integration) {
    let page = 1

    while (true) {
      const getContactsParams: GetContactListParams = {
        limit: 250,
        page: page,
      }

      const contacts: GetContactListResponse = await withAmoTokenRefresh(
        integration,
        this.authRepo,
        this.amoClient.auth,
        (accessToken) => this.amoClient.contact.getContacts(integration.domain, accessToken, getContactsParams)
      )

      if (contacts._embedded.contacts.length === 0) {
        break
      }

      for (const contact of contacts._embedded.contacts) {
        const contactModel: Contact = {
          id: contact.id,
          name: contact.name,
          first_name: contact.first_name,
          last_name: contact.last_name,
          responsible_user_id: contact.responsible_user_id,
        }

        try {
          await this.authRepo.createContact(contactModel)
        } catch (error) {
          logger.error("AuthService - completeOauth - create contact", { error: error as Error })
          continue
        }
      }

      page++
    }
  }

  private async loadLeads(integration: Integration) {
    const responsibleUserNameCache = new Map<number, string | null>()

    let page = 1

    while (true) {
      const getLeadsParams: GetLeadsParams = {
        with: ["contacts"],
        limit: 250,
        page: page,
      }

      const leads: GetLeadsResponse = await withAmoTokenRefresh(
        integration,
        this.authRepo,
        this.amoClient.auth,
        (accessToken) => this.amoClient.leads.getLeads(integration.domain, accessToken, getLeadsParams)
      )

      if (leads._embedded.leads.length === 0) {
        break
      }

      for (const lead of leads._embedded.leads) {
        let responsible_user_name: string | null = null
        const cached = responsibleUserNameCache.get(lead.responsible_user_id)
        if (cached !== undefined) {
          responsible_user_name = cached
        } else {
          try {
            const user = await withAmoTokenRefresh(
              integration,
              this.authRepo,
              this.amoClient.auth,
              (accessToken) => this.amoClient.users.getUserByID(integration.domain, accessToken, lead.responsible_user_id, {}),
            )
            responsible_user_name = user.name ?? null
          } catch (error) {
            logger.warn("AuthService - loadLeads - get user failed", { responsibleUserId: lead.responsible_user_id, error: error as Error })
            responsible_user_name = null
          }
          responsibleUserNameCache.set(lead.responsible_user_id, responsible_user_name)
        }

        const leadModel: Lead = {
          id: lead.id,
          name: lead.name,
          responsible_user_id: lead.responsible_user_id,
          responsible_user_name,
          pipeline_id: lead.pipeline_id,
          status_id: lead.status_id,
        }

        try {
          await this.authRepo.upsertLead(leadModel)
        } catch (error) {
          logger.error("AuthService - completeOauth - upsert lead", { error: error as Error })
          continue
        }

        try {
          await this.authRepo.syncLeadCustomFieldsRows(
            leadModel.id,
            rowsFromAmoApiCustomFieldsValues(lead.custom_fields_values),
          )
        } catch (error) {
          logger.error("AuthService - completeOauth - sync lead custom fields", { error: error as Error })
        }
      }

      page++
    }
  }
}
