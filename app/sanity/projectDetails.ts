declare global {
  interface Window {
    ENV: {
      VITE_SANITY_PROJECT_ID: string
      VITE_SANITY_DATASET: string
      VITE_SANITY_API_VERSION: string
    }
  }
}

let projectId: string
let dataset: string
let apiVersion: string
const defaultApiVersion = '2024-10-01'

if (typeof window !== 'undefined' && window.ENV) {
  projectId = window.ENV.VITE_SANITY_PROJECT_ID
  dataset = window.ENV.VITE_SANITY_DATASET
  apiVersion = window.ENV.VITE_SANITY_API_VERSION ?? defaultApiVersion
} else if (typeof process !== 'undefined' && process.env.VITE_SANITY_PROJECT_ID) {
  projectId = process.env.VITE_SANITY_PROJECT_ID!
  dataset = process.env.VITE_SANITY_DATASET!
  apiVersion = process.env.VITE_SANITY_API_VERSION ?? defaultApiVersion
} else {
  projectId = import.meta.env.VITE_SANITY_PROJECT_ID
  dataset = import.meta.env.VITE_SANITY_DATASET
  apiVersion = import.meta.env.VITE_SANITY_API_VERSION ?? defaultApiVersion
}

export { apiVersion, dataset, projectId }

export const projectDetails = () => ({ projectId, dataset, apiVersion })

if (!projectId) {
  throw new Error('Missing VITE_SANITY_PROJECT_ID in .env')
}
if (!dataset) {
  throw new Error('Missing VITE_SANITY_DATASET in .env')
}
