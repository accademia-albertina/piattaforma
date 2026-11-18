/**
 * Editor dei testi ricchi: quello predefinito di Payload più le tabelle (regolamenti, tasse).
 * Lo usano il config e la conversione da HTML, così le tabelle importate passano la validazione.
 */
import {
  EXPERIMENTAL_TableFeature,
  lexicalEditor,
  type FeatureProviderServer,
} from '@payloadcms/richtext-lexical'

export const funzioniEditor = ({
  defaultFeatures,
}: {
  defaultFeatures: FeatureProviderServer<unknown, unknown, unknown>[]
}) => [...defaultFeatures, EXPERIMENTAL_TableFeature()]

export const editor = lexicalEditor({ features: funzioniEditor })
