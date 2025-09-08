import type {
  ComponentLoaderArgs,
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from "@weaverse/hydrogen";
import { forwardRef } from "react";
import {
  Section,
  type SectionProps,
  sectionSettings,
} from "~/components/section";
import { InstagramProvider } from "./context";

type InstagramData = {
  instagramToken: string;
  loaderData?: {
    data?: {
      id: string;
      media_url: string;
      username?: string;
    }[];
  } | null;
};

type InstagramProps = HydrogenComponentProps<
  Awaited<ReturnType<typeof loader>>
> &
  InstagramData &
  SectionProps;

const Instagram = forwardRef<HTMLElement, InstagramProps>((props, ref) => {
  let { instagramToken, loaderData, children, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      <InstagramProvider value={{ loaderData }}>
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-4">
          {children}
        </div>
      </InstagramProvider>
    </Section>
  );
});

export default Instagram;

export let loader = async (args: ComponentLoaderArgs<InstagramData>) => {
  let { weaverse, data } = args;
  if (data.instagramToken) {
    try {
      let API = `https://graph.instagram.com/me/media?fields=id,media_url,username&access_token=${data.instagramToken}`;
      let res = await weaverse.fetchWithCache(API);
      return res;
    } catch (error) {
      console.error("Error fetching Instagram data:", error);
      return null;
    }
  }
  return null;
};

export const schema: HydrogenComponentSchema = {
  type: "instagram",
  title: "Instagram",
  inspector: [
    {
      group: "Instagram",
      inputs: [
        {
          type: "text",
          name: "instagramToken",
          label: "Instagram api token",
          placeholder: "@instagram",
          helpText:
            'Learn more about how to get <a href="https://docs.oceanwp.org/article/487-how-to-get-instagram-access-token" target="_blank">API token for Instagram</a> section.',
        },
      ],
    },
    ...sectionSettings,
  ],
  childTypes: ["instagram--content", "instagram--slider"],
  presets: {
    children: [
      {
        type: "instagram--content",
        title: "Instagram",
        subtitle: "@instagram",
        description:
          "Meet the room edits: real life shots of our furniture in action. (We like to think we style our furniture well, but we can't help but show off how you do it.)",
        alignment: "center",
      },
      {
        type: "instagram--slider",
        slidesPerView: 3,
        spaceBetween: 16,
        showNavigation: true,
      },
    ],
  },
};
