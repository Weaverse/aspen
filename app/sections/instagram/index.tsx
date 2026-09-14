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
      permalink?: string;
      thumbnail_url?: string;
      username?: string;
    }[];
  } | null;
};

type InstagramProps = HydrogenComponentProps<
  Awaited<ReturnType<typeof loader>>
> &
  InstagramData &
  SectionProps;

const instagramSectionSettings = sectionSettings.map((group) =>
  group.group === "Layout"
    ? {
        ...group,
        inputs: group.inputs.filter(
          (input) => input.name !== "width" && input.name !== "gap",
        ),
      }
    : group,
);

const Instagram = forwardRef<HTMLElement, InstagramProps>((props, ref) => {
  let { instagramToken, loaderData, children, ...rest } = props;

  return (
    <Section
      ref={ref}
      {...rest}
      width="full"
      className="instagram-section bg-[#EDEDED]"
    >
      <InstagramProvider value={{ loaderData }}>
        <div className="instagram-row mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-5 md:flex-row md:items-stretch md:gap-6 md:px-8 lg:px-0">
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
      let API = `https://graph.instagram.com/me/media?fields=id,media_url,permalink,thumbnail_url,username&access_token=${data.instagramToken}`;
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
  settings: [
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
    ...instagramSectionSettings,
  ],
  childTypes: ["instagram--content", "instagram--slider"],
  presets: {
    width: "full",
    verticalPadding: "medium",
    backgroundColor: "#EDEDED",
    backgroundFor: "section",
    children: [
      {
        type: "instagram--content",
        headingContent: "INSTAGRAM",
        headingTagName: "h2",
        subheadingContent: "@aspen_life",
        paragraphContent:
          "Meet the room edits: real life shots of our furniture in action.",
        buttonContent: "EXPLORE NOW",
        to: "https://www.instagram.com/",
        alignment: "left",
        paragraphAlignment: "left",
      },
      { type: "instagram--slider" },
    ],
  },
};
