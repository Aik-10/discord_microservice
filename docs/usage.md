### Base URL

```
https://your-api-base-url.com/api
```

### Authentication

All requests to the API must include the `X-API-Key` header. This header is required for authentication.

### Endpoints

#### Get Guild users

<details>
 <summary><code>GET</code> <code><b>/users</b></code></summary>

##### Parameters

> | name    | type     | data type | description            |
> | ------- | -------- | --------- | ---------------------- |
> | guildId | required | string    | Discord server GuildId |

##### Responses

> | http code | content-type       | response                                                   |
> | --------- | ------------------ | ---------------------------------------------------------- |
> | `200`     | `application/json` | `{"code":"200","status": "success","data":Array}`          |
> | `400`     | `application/json` | `{"code":"400","status": "error","message":"Bad Request"}` |

</details>

#### Get Guild user data

<details>
 <summary><code>GET</code> <code><b>/user/:id</b></code></summary>

##### Parameters

> | name    | type     | data type | description            |
> | ------- | -------- | --------- | ---------------------- |
> | id      | required | string    | Discord userId         |
> | guildId | required | string    | Discord server GuildId |

##### Responses

> | http code | content-type       | response                                                   |
> | --------- | ------------------ | ---------------------------------------------------------- |
> | `200`     | `application/json` | `{"code":"200","status": "success","data":Array}`          |
> | `400`     | `application/json` | `{"code":"400","status": "error","message":"Bad Request"}` |

</details>

#### Get Guild user count

<details>
 <summary><code>GET</code> <code><b>/getUsersCount</b></code></summary>

##### Parameters

> | name    | type     | data type | description            |
> | ------- | -------- | --------- | ---------------------- |
> | guildId | required | string    | Discord server GuildId |

##### Responses

> | http code | content-type       | response                                                             |
> | --------- | ------------------ | -------------------------------------------------------------------- |
> | `200`     | `application/json` | `{"code":"200","status": "success","data":{ memberAmount: number }}` |
> | `400`     | `application/json` | `{"code":"400","status": "error","message":"Bad Request"}`           |

</details>

#### Get Guild channel users

<details>
 <summary><code>GET</code> <code><b>/channelUsers</b></code></summary>

##### Parameters

> | name      | type     | data type | description              |
> | --------- | -------- | --------- | ------------------------ |
> | guildId   | required | string    | Discord server GuildId   |
> | channelId | required | string    | Discord server channelId |

##### Responses

> | http code | content-type       | response                                                   |
> | --------- | ------------------ | ---------------------------------------------------------- |
> | `200`     | `application/json` | `{"code":"200","status": "success","data":Array}`          |
> | `400`     | `application/json` | `{"code":"400","status": "error","message":"Bad Request"}` |

</details>

#### Kick the user out of the voice channel

<details>
 <summary><code>POST</code> <code><b>/kickUserInVoice/:id</b></code></summary>

##### Parameters

> | name    | type     | data type | description            |
> | ------- | -------- | --------- | ---------------------- |
> | id      | required | string    | Discord userId         |
> | guildId | required | string    | Discord server GuildId |

##### Responses

> | http code | content-type       | response                                                   |
> | --------- | ------------------ | ---------------------------------------------------------- |
> | `200`     | `application/json` | `{"code":"200","status": "success","data":String}`         |
> | `400`     | `application/json` | `{"code":"400","status": "error","message":"Bad Request"}` |

</details>

#### Move user to another voice channel

<details>
 <summary><code>POST</code> <code><b>/moveUser/:id</b></code></summary>

##### Parameters

> | name      | type     | data type | description                      |
> | --------- | -------- | --------- | -------------------------------- |
> | id        | required | string    | Discord userId                   |
> | guildId   | required | string    | Discord server GuildId           |
> | channelId | required | string    | Discord server channelId to move |

##### Responses

> | http code | content-type       | response                                                   |
> | --------- | ------------------ | ---------------------------------------------------------- |
> | `200`     | `application/json` | `{"code":"200","status": "success","data":String}`         |
> | `400`     | `application/json` | `{"code":"400","status": "error","message":"Bad Request"}` |

</details>