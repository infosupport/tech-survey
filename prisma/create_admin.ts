import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/*
 * This script is used to create an initial admin user
 * The ADMIN_USER_ID environment variable must be set to the id of the user to be made an admin
 * You will need to execute this script manually on the server, after running the migrations
 */
async function main() {
    const adminId = process.env.ADMIN_USER_ID;

    const existingAdmin = await prisma.user.findMany({
        where: {
            isAdministrator: true,
        },
    });

    if (!adminId || existingAdmin.length > 0) {
        console.error("ADMIN_USER_ID not set or admin already exists");
        process.exit(1);
    }

    const user = await prisma.user.findUnique({
        where: {
            id: adminId,
        },
    });

    if (!user) {
        console.error("User not found");
        process.exit(1);
    }

    // Set the boolean value to true
    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            isAdministrator: true,
        },
    });

    console.log("Admin user created");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
