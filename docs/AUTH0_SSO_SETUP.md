# Auth0 Social Login (SSO) Setup Guide

This guide explains how to configure Google and Apple social login in Auth0 for the GamePay platform.

## Prerequisites

- An Auth0 account (https://auth0.com)
- Google Cloud Console access (for Google SSO)
- Apple Developer account (for Apple SSO)

## 1. Google Social Connection

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Add the following Authorized redirect URIs:
   ```
   https://YOUR_AUTH0_DOMAIN/login/callback
   ```
   Replace `YOUR_AUTH0_DOMAIN` with your Auth0 tenant domain (e.g., `your-tenant.us.auth0.com`)
7. Copy the **Client ID** and **Client Secret**

### Step 2: Configure Google in Auth0

1. Log in to [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Authentication** > **Social**
3. Click **+ Create Connection**
4. Select **Google**
5. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
6. Select the scopes you need (at minimum: `email`, `profile`)
7. Click **Create**
8. Go to the **Applications** tab and enable this connection for your application

## 2. Apple Social Connection

### Step 1: Configure Apple Developer Account

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create a new **App ID**:
   - Enable **Sign in with Apple**
   - Note your Bundle ID
4. Create a new **Services ID**:
   - Enable **Sign in with Apple**
   - Configure the domain and return URL:
     ```
     Domain: YOUR_AUTH0_DOMAIN
     Return URL: https://YOUR_AUTH0_DOMAIN/login/callback
     ```
5. Create a new **Key**:
   - Enable **Sign in with Apple**
   - Download the key file (.p8)
   - Note the Key ID

### Step 2: Configure Apple in Auth0

1. Log in to [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Authentication** > **Social**
3. Click **+ Create Connection**
4. Select **Apple**
5. Enter your Apple credentials:
   - **Client ID**: Your Services ID
   - **Team ID**: Your Apple Developer Team ID
   - **Key ID**: From the key you created
   - **Client Secret Signing Key**: Upload or paste the .p8 key content
6. Click **Create**
7. Go to the **Applications** tab and enable this connection for your application

## 3. Configure Auth0 Application

### Enable Social Connections

1. In Auth0 Dashboard, go to **Applications** > **Applications**
2. Select your application
3. Go to the **Connections** tab
4. Enable the social connections you created (Google, Apple)

### Configure Callback URLs

In your application settings, add the callback URLs:

```
Allowed Callback URLs:
http://localhost:5173
http://localhost:5174
https://your-production-domain.com

Allowed Logout URLs:
http://localhost:5173
http://localhost:5174
https://your-production-domain.com

Allowed Web Origins:
http://localhost:5173
http://localhost:5174
https://your-production-domain.com
```

## 4. Environment Variables

Update your `.env` file with the Auth0 configuration:

```env
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your_auth0_client_id
VITE_AUTH0_AUDIENCE=https://api.waffogamepay.local
```

## 5. Testing

1. Start your application
2. Click the "Login" button
3. You should see options for Google and Apple login in the Auth0 Universal Login page
4. Test each provider to ensure proper authentication

## Troubleshooting

### Common Issues

1. **Callback URL Mismatch**
   - Ensure the callback URL in Auth0 matches exactly with your application URL
   - Check for trailing slashes

2. **CORS Errors**
   - Add your application origin to "Allowed Web Origins" in Auth0

3. **Invalid Credentials**
   - Double-check the Client ID and Secret are correct
   - For Apple, ensure the key file content is properly formatted

### Debug Tips

- Use Auth0's **Try** button in the social connection settings to test the connection
- Check browser console for detailed error messages
- Review Auth0 logs in **Monitoring** > **Logs**

## Related Documentation

- [Auth0 Google Social Connection](https://auth0.com/docs/authenticate/identity-providers/social-identity-providers/google)
- [Auth0 Apple Social Connection](https://auth0.com/docs/authenticate/identity-providers/social-identity-providers/apple)








