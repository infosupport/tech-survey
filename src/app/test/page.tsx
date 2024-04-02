import { authConstants, type MemberOfResponse, type Office365User, type User } from "~/models/types";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";

const AddRoleToUser = async () => {
  const validate = async (accessToken: string): Promise<User> => {
    // GET https://graph.microsoft.com/v1.0/users/{id | userPrincipalName}
    const meResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const memberOf = await fetch(
      "https://graph.microsoft.com/v1.0/me/memberOf",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (memberOf.status !== 200) {
      throw new Error(
        `Authentication failed. Response of https://graph.microsoft.com/v1.0/me/memberOf was with a ${memberOf.status}`,
      );
    }
    if (meResponse.status !== 200) {
        throw new Error(
            `Authentication failed. Response of https://graph.microsoft.com/v1.0/me was with a ${meResponse.status}`,
        );
    }

    const officeUser = (await meResponse.json()) as Office365User;
    const memberOfJson = (await memberOf.json()) as MemberOfResponse;
    const groupIds = memberOfJson.value.map(({ id }) => id);

    const role: string = groupIds.includes(authConstants.manager ?? "") ? "manager" : "defaultRole";
    }
    return {
      email: officeUser.mail,
      name: officeUser.displayName,
      role,
    };
  };

  console.log(accessToken?.accounts[0].access_token);
  await validate(accessToken?.accounts[0].access_token);

  return <div></div>;
};

export default authConstants;

// const officeUser = (await meResponse.json()) as Office365User;
// const memberOfJson = (await memberOf.json()) as MemberOfResponse;
// const groupIds = memberOfJson.value.map(({ id }) => id);
// const role: UserRole | undefined =
//   authConstants.roleOverride ??
//   (groupIds.includes(authConstants.adminGroupObjectId)
//     ? "admin"
//     : groupIds.includes(authConstants.projectverantwoordelijkeGroupObjectId)
//       ? "projectverantwoordelijke"
//       : groupIds.includes(authConstants.financieelBeheerderGroupObjectId)
//         ? "financieelBeheerder"
//         : undefined);
// if (!role) {
//   throw new UnauthorizedException(
//     `Not authorized, as the user does not belong to a RockSolid group.`,
//   );
// }
// return {
//   email: officeUser.mail,
//   name: officeUser.displayName,
//   role,
// };
// }

//
