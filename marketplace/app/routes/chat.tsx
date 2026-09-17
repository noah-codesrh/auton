import type { Route } from "./+types/chat";
import { ChatPage } from "../components/chat-page";
import { pageTitle } from "../config/site";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: pageTitle("Chat") },
    {
      name: "description",
      content:
        "Chat with any AI model using a single credit balance topped up with $AUTO or USDG — at a discount to market rates.",
    },
  ];
}

export default function Chat() {
  return <ChatPage />;
}
