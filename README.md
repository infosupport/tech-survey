# Info Support Tech Survey

## Setup for local development

> When using Nix flakes with direnv integration, skip right ahead to step 5. The database can be started using `devenv up`

1. Install [Rancher](https://rancherdesktop.io/) (or Docker if you prefer/you have a license) and make sure it is running.
2. Spin up a postgres database with the following command. You need to choose your own password and username:
```bash
docker run --name tech-survey -e "POSTGRES_USER=dummyusr" -e "POSTGRES_PASSWORD=dummypw" -e "POSTGRES_DB=tech-survey" -d -p 5432:5432 docker.io/postgres
```
3. Copy `.env.example` to `.env` and update the `DATABASE_URL` variable with the username and password you chose in the previous step. The default value is:
`DATABASE_URL="postgresql://dummyusr:dummypw@localhost/tech-survey`
4. Create a secret for NEXTAUTH_SECRET by running the following command. Use WSL for this command if you are on Windows.
```bash
openssl rand -base64 32
```
5. Ask a co-worker for the Azure credentials or the rights to create an app registration yourself.
   1. AZURE_AD_CLIENT_SECRET: A secret credential created in an app registration.
   2. AZURE_AD_CLIENT_ID: The client ID of the app registration.
   3. AZURE_AD_TENANT_ID: The tenant ID of the Azure AD.
6. Run the following commands to setup your db locally.
```bash
npm run db:generate
npm run db:push
```
7. You can seed the database with some initial data by running the following command. For this you need a file called `survey.csv` in the folder `./import`. Ask a co-worker for this file.
```bash
npm run db:seed
```
Note that if you run this command again, your database will be populated with duplicate data.
8. Now you should be ready to go! 🎉 You can check your local database by opening the studio of Prisma. Here you should see that the database populated with questions, roles, etc.
```bash
npm run db:studio
```

## Running the application
To run the application, you can use the following command:
```bash
npm run dev
```

## Running the tests
Tests are done using Playwright. To run the tests, you can use the following command:
```bash
npm run test
```

## Code style
In this project, the code style is enforced by ESLint and Prettier. You can run the following command to check if your code is compliant with the code style:
```bash
npm run lint
```
If you want to automatically fix the code style issues, you can run the following command:
```bash
npm run lint:fix
```
Your IDE can help you with this, check out these links:
- Jetbrains
  - [ESLint](https://www.jetbrains.com/help/rider/eslint.html) 
  - [Prettier](https://www.jetbrains.com/help/rider/Prettier.html)
- Visual Studio Code
  - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
  - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- Visual Studio
  - [ESLint](https://learn.microsoft.com/en-us/visualstudio/javascript/linting-javascript?view=vs-2022)
  - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Database changes
If you make changes to the database schema, you need to generate a new migration. You can do this by running the following command:
```bash
npx prisma migrate dev --name <name-of-your-migration>
```
For more information, look at the Prisma [documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate).