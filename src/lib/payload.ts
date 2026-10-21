import config from '@payload-config'
import { getPayload } from 'payload'

/** Istanza Payload per le pagine pubbliche (sempre senza privilegi: overrideAccess va passato a false). */
export const payloadClient = () => getPayload({ config })
