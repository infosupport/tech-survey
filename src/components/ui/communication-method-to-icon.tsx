import {
    EmailLogo,
    PhoneLogo,
    SignalLogo,
    SlackLogo,
    TeamsLogo,
    WhatsappLogo,
} from "~/components/svg";
import { type JSX } from "react";

const communicationMethodToIcon: Record<string, JSX.Element> = {
    SLACK: <SlackLogo />,
    EMAIL: <EmailLogo />,
    PHONE: <PhoneLogo />,
    SIGNAL: <SignalLogo />,
    TEAMS: <TeamsLogo />,
    WHATSAPP: <WhatsappLogo />,
};

export default communicationMethodToIcon;
