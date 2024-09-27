# Info Support Tech Survey

## Setup for local development

### Setup database

1. Make sure docker desktop or another tool of your liking is installed on your machine.
2. Spin up a postgres database with the following command. You need to choose your own password and username:
```bash
docker run --name tech-survey -e "POSTGRES_USER=dummyusr" -e "POSTGRES_PASSWORD=dummypw" -e "POSTGRES_DB=tech-survey" -d -p 5432:5432 docker.io/postgres
```
3. Make sure to also use that username and password inside of the `.env` file:
`DATABASE_URL="postgresql://dummyusr:pas$word@localhost:dummypw/tech-survey`
4. Run the following commands to setup your db locally. For the `npm run db:seed` command you need a CSV file to populate the database. You can ask your co-worker for this CSV file, or skip this if you don't want any data.
```bash
npm run db:generate
npm run db:push
npm run db:seed
```
5. Now you should be ready to go! 🎉 You can check your local database by opening the studio of Primsa:
```bash
npm run db:studio
```

### Setup Azure AD authentication

The Azure AD credentials can be found in the `.env` file:
```
AZURE_AD_CLIENT_ID="dummy"
AZURE_AD_CLIENT_SECRET="dummy"
AZURE_AD_TENANT_ID="dummy"
```

You can go one of two ways to get your hands on these credentials:
- Get them yourself from the Azure AD on the Azure Environment of your company
- Ask a co-worker who has already worked on the project to sent those credentials to you in a secure manner

### Setup NextAuth

1. For using next auth, we need to setup a secret. This can be done in the .env file:
```
NEXTAUTH_SECRET="dummy"
```
2. Generate a new secret wit the following command:
```bash
openssl rand -base64 32
```
3. Update the `NEXTAUTH_SECRET` variable with the new value
