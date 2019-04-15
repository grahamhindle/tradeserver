import { prisma } from './generated/prisma-client'
import datamodelInfo from './generated/nexus-prisma'
import * as path from 'path'
import { stringArg, idArg } from 'nexus'
import { prismaObjectType, makePrismaSchema } from 'nexus-prisma'
import { GraphQLServer } from 'graphql-yoga'

const Query = prismaObjectType({
  name: 'Query',
  definition(t) {
    t.prismaFields(['trade'])
    t.list.field('trades', {
      type: 'Trade',
      resolve: (_, args, ctx) => ctx.prisma.trades({ where: { live: true } })
    })
    t.list.field('tradesByUser', {
      type: 'Trade',
      args: { email: stringArg() },
      resolve: (_, { email }, ctx) => ctx.prisma.trades({ where: { trader: { email } } })
    })
  }
})

const Mutation = prismaObjectType({
  name: 'Mutation',
  definition(t) {
    t.prismaFields(['createUser', 'deleteTrade'])
    t.field('createPipelineTrade', {
      type: 'Trade',
      args: {
        description: stringArg(),
        traderId: idArg({ nullable: true })
      },
      resolve: (_, { description, traderId }, ctx) => ctx.prisma.createTrade({ 
        description,
        trader: { connect: { id: traderId }} 
      })
    })
    t.field('live', {
      type: 'Trade',
      nullable: true,
      args: { id: idArg() },
      resolve: (_, { id }, ctx) => ctx.prisma.updateTrade({
        where: { id },
        data: { live: true }
      })
    })
  }
})

const schema = makePrismaSchema({
  types: [Query, Mutation],

  prisma: {
    datamodelInfo,
    client: prisma
  },

  outputs: {
    schema: path.join(__dirname, './generated/schema.graphql'),
    typegen: path.join(__dirname, './generated/nexus.ts'),
  },
})

const server = new GraphQLServer({
  schema,
  context: { prisma }
})
server.start(() => console.log('Server is running on http://localhost:4000'))