# BuildersGates

A community forum application built with Next.js and Supabase.

## Getting Started

First, install dependencies:

```bash
npm install
```

## Setting up Supabase

1. Create a Supabase account at [https://supabase.io](https://supabase.io)
2. Create a new project in Supabase
3. In your project settings, go to the "API" section to find your project URL and anon key
4. Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Setting up GitHub OAuth

1. Go to your GitHub account settings
2. Navigate to Developer Settings > OAuth Apps > New OAuth App
3. Fill in the following:
   - Application name: BuildersGates (or your preferred name)
   - Homepage URL: http://localhost:3000 (or your production URL)
   - Authorization callback URL: http://localhost:3000/auth/callback (or your production URL with /auth/callback)
4. Register the application and note your Client ID and Client Secret
5. In Supabase, go to Authentication > Providers > GitHub
6. Enable GitHub auth and enter your Client ID and Client Secret
7. Save changes

## Running the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- GitHub authentication
- User profiles
- Forum categories
- Community statistics

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
