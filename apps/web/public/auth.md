# Agent Authentication & Registration (Auth.md)

ProductScroll supports autonomous AI agents and automated discovery.

## Identity & Protocol Discovery
- **Resource**: `https://prod.ayushkumarsingh.in`
- **OAuth Authorization Server**: `https://prod.ayushkumarsingh.in/.well-known/oauth-authorization-server`
- **OpenID Configuration**: `https://prod.ayushkumarsingh.in/.well-known/openid-configuration`
- **OAuth Protected Resource**: `https://prod.ayushkumarsingh.in/.well-known/oauth-protected-resource`
- **API Catalog**: `https://prod.ayushkumarsingh.in/.well-known/api-catalog`
- **API Documentation**: `https://productscroll-api.onrender.com/api/docs`
- **OpenAPI Schema**: `https://productscroll-api.onrender.com/api/docs/json`

## Supported Grant Types
- `authorization_code`
- `client_credentials`
- `refresh_token`

## Supported Scopes
- `read`: Read public startups, posts, reels, and profiles.
- `write`: Create posts and update product details.
- `messages`: Access and participate in conversation threads with builders.
- `profile`: Read authenticated builder profile.

## Agent Registration
Automated agents should register by sending an enrollment payload to:
`POST https://productscroll-api.onrender.com/api/auth/agents/register`
or by requesting API keys via the builder console.
