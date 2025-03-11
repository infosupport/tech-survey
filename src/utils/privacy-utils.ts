export const aggregatedDataByRole: Record<
    string,
    Record<
        string,
        {
            name: string;
            id: string;
            communicationPreferences: string[];
            counts: number[];
        }
    >
> = {
    role1: {
        question1: {
            name: "John Doe",
            id: "1",
            communicationPreferences: ["SLACK", "EMAIL", "WHATSAPP"],
            counts: [1, 2, 3, 4],
        },
        question2: {
            name: "Jane Doe",
            id: "2",
            communicationPreferences: ["SIGNAL", "PHONE", "TEAMS"],
            counts: [2, 3, 4, 5],
        },
    },
};

export const dataByRoleAndQuestion: Record<
    string,
    Record<
        string,
        {
            name: string;
            email: string;
            communicationPreferences: string[];
            answer: string;
        }[]
    >
> = {
    role1: {
        question1: [
            {
                name: "Jane Doe",
                email: "jane.doe@example.com",
                communicationPreferences: ["SIGNAL", "PHONE", "TEAMS"],
                answer: "0",
            },
            {
                name: "John Doe",
                email: "john.doe@example.com",
                communicationPreferences: ["SLACK", "EMAIL", "WHATSAPP"],
                answer: "3",
            },
        ],
    },
};
