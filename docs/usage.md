### Base URL

```
https://your-api-base-url.com/api
```

### Authentication

All requests to the API must include the `X-API-Key` header. This header is required for authentication.

### Endpoints

#### Get Guild users
<summary><code>GET</code> <code><b>/users</b></code></summary>

#### Get Guild user data
<summary><code>GET</code> <code><b>/user/:id</b></code></summary>

#### Get Guild user count
<summary><code>GET</code> <code><b>/getUsersCount</b></code></summary>

#### Get Guild channel users
<summary><code>GET</code> <code><b>/channelUsers</b></code></summary>

#### Kick the user out of the voice channel
<summary><code>POST</code> <code><b>/kickUserInVoice/:id</b></code></summary>

#### Move user to another voice channel

<summary><code>POST</code> <code><b>/moveUser/:id</b></code></summary>