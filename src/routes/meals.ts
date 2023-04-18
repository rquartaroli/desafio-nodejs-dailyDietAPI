import { FastifyInstance } from "fastify"
import crypto from "node:crypto"
import { knex } from "../database"
import { z } from "zod"
import { checkSessionIdExists } from "../middleware/check-session-id-exists"

export async function mealsRoutes(app: FastifyInstance) {
  app.get('/', {
    preHandler: [checkSessionIdExists],
  }, async (request, reply) => {
    const { sessionId } = request.cookies

    const meals = await knex('meals').where('session_id', sessionId).select('*')

    return reply.status(200).send({meals})
  })

  app.get('/:id', {
    preHandler: [checkSessionIdExists],
  }, async (request, reply) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })
    const { sessionId } = request.cookies
    const { id } = getMealParamsSchema.parse(request.params)

    const meal = await knex('meals').where({
      id: id,
      session_id: sessionId,
    }).first()

    return reply.status(200).send({meal})
  })

  app.get('/metrics', {
    preHandler: [checkSessionIdExists],
  }, async (request, reply) => {
    const { sessionId } = request.cookies

    const meals = await knex('meals').where('session_id', sessionId).select('*')

    if(meals) {
      const quantityMeals = meals.length
      const totalMealsInDiety = meals.reduce(
        (accumulator, currentValue) => 
          currentValue.its_in_diety ? accumulator + 1 : accumulator + 0, 0
      )
      const totalMealsOutDiety = meals.reduce(
        (accumulator, currentValue) => 
          currentValue.its_in_diety ? accumulator + 0 : accumulator + 1, 0
      )

      return reply.status(200).send({
        quantityMeals: quantityMeals,
        totalMealsInDiety: totalMealsInDiety,
        totalMealsOutDiety: totalMealsOutDiety,
      })
    }
    return reply.status(200).send(meals)
    
  })

  app.post('/', async (request, reply) => {

    const createMealBodySchema = z.object({
      name: z.string(),
      describe: z.string(),
      its_in_diety: z.boolean(),
    })

    const { name, describe, its_in_diety } = createMealBodySchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if(!sessionId) {
      sessionId = crypto.randomUUID(),

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('meals').insert({
      id: crypto.randomUUID(),
      name,
      describe,
      its_in_diety,
      session_id: sessionId
    })
  
    return reply.status(201).send()
  })

  app.put('/:id',{
    preHandler: [checkSessionIdExists],
  }, async (request, reply) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })
    const { sessionId } = request.cookies
    const { id } = getMealParamsSchema.parse(request.params)

    const updateMealBodySchema = z.object({
      name: z.string(),
      describe: z.string(),
      its_in_diety: z.boolean(),
    })

    const { name, describe, its_in_diety } = updateMealBodySchema.parse(request.body)

    await knex('meals').where({
      id: id,
      session_id: sessionId,
    }).update({
      name,
      describe,
      its_in_diety,
    })

    return reply.status(204).send()
  })

  app.delete('/:id',{
    preHandler: [checkSessionIdExists],
  }, async (request, reply) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })
    const { sessionId } = request.cookies
    const { id } = getMealParamsSchema.parse(request.params)

    await knex('meals').where({
      id: id,
      session_id: sessionId,
    }).del()

    return reply.status(200).send({message: 'meal deleted successfully'})

  })
}