# Deploying to Cloudflare Pages

Your project is already configured for **Static Site Generation (SSG)**, which
is perfect for Cloudflare Pages.

## 1. Push to GitHub/GitLab

Ensure your code is pushed to a remote repository.

## 2. Create a Project in Cloudflare Pages

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers &
   Pages** > **Create Application** > **Pages** > **Connect to Git**.
2. Select your repository.

## 3. Configure Build Settings

Use the following settings:

- **Production branch**: `main` (or your default branch)
- **Framework preset**: `Next.js (Static HTML Export)` (or select `None`)
- **Build command**: `bun run build` (or `npm run build`)
- **Build output directory**: `out`

> **Note:** Since you are using Bun, Cloudflare Pages supports it natively. If
> you encounter issues, you can set an Environment Variable `PYTHON_VERSION` to
> `3.11` (sometimes needed for build tools) or ensure the build image is set to
> the latest version.

## 4. Deploy

Click **Save and Deploy**. Cloudflare will build your site and deploy it to a
global CDN.
