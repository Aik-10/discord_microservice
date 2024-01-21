<a href="https://pprp.fi/"><img src="https://i.imgur.com/1MrKKwu.png" align="right" /></a>

# Peliporukka RP Discord Microservice (Typescript)

Welcome to the Peliporukka RP Discord Microservice repository. This microservice is an integral part of the Peliporukka RP backend system.

## Development

To get started, install the required packages with `pnpm install`.

Initiate the development server by running `pnpm run ts:watch && pnpm run watch`. It automatically refreshes the page upon code changes.

## Services

- Express.js
- Discord.js 14v
- [Redis Cache](https://redis.io/)
- [RabbitMQ](https://www.rabbitmq.com/) Message Queue

## Usage
- Wiki page [github.io/discord_microservice/usage](https://aik-10.github.io/discord_microservice/usage)

## Production

Build the project using `pnpm run build`, generating files in the `dist` folder. Preview the production build with `pnpm run start`.
