import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    meals: {
      id: string
      session_id?: string
      name: string
      describe: string
      created_at: string
      its_in_diety: boolean
    }
  }
}