import type {
  HydrogenComponent,
  WeaverseBlog,
  WeaverseVideo,
} from "@weaverse/hydrogen";
import { forwardRef, lazy, Suspense } from "react";
import { Link } from "react-router";

const ReactPlayer = lazy(() => import("react-player"));

interface VideoItemProps {
  video: WeaverseVideo;
  date: string;
  author: string;
  videoHandle: WeaverseBlog;
}

let VideoItem = forwardRef<HTMLElement, VideoItemProps>((props, ref) => {
  let {
    video = {
      url: "https://cdn.shopify.com/videos/c/o/v/4f8e7bc773bd49138b00903c987d528b.webm",
      alt: "Video 2",
      mediaContentType: "VIDEO",
    },
    date,
    author,
    videoHandle,
  } = props;

  const Tag = videoHandle?.handle ? Link : "div";

  return (
    <div ref={ref as any} className="flex h-full w-full flex-col">
      <Tag to={`/blogs/${videoHandle?.handle}`} className="flex h-full w-full">
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <Suspense fallback={null}>
            <ReactPlayer
              url={video.url}
              loop={true}
              width="100%"
              height="100%"
              controls={false}
              config={{
                file: {
                  attributes: {
                    playsInline: true,
                    autoPlay: true,
                    muted: true,
                  },
                },
                youtube: {
                  playerVars: {
                    playsinline: 1,
                    autoplay: 1,
                    controls: 0,
                    mute: 1,
                    loop: 1,
                  },
                },
              }}
              className="aspect-[3/4] object-cover"
            />
          </Suspense>
          <div className="absolute right-0 bottom-0 left-0 bg-[rgba(211,195,167,0.9)] p-3">
            <div className="flex flex-col gap-1">
              <p className="font-open-sans font-semibold text-[#29231E] text-sm leading-[1.6] tracking-[0.02em]">
                {videoHandle?.handle || "@videohandle"}
              </p>
              <p className="font-open-sans text-[#29231E] text-sm leading-[1.6] tracking-[0.02em]">
                {date} — {author}
              </p>
            </div>
          </div>
        </div>
      </Tag>
    </div>
  );
});

export let schema: HydrogenComponent["schema"] = {
  type: "video--item",
  title: "Video",
  inspector: [
    {
      group: "Video",
      inputs: [
        {
          type: "video",
          name: "video",
          label: "Video",
          helpText: "Support YouTube, Vimeo, MP4, WebM, and HLS streams.",
        },
        {
          type: "blog",
          name: "videoHandle",
          label: "Video handle",
        },
        {
          type: "text",
          name: "date",
          label: "Date",
          defaultValue: "August 30, 2023",
        },
        {
          type: "text",
          name: "author",
          label: "Author",
          defaultValue: "Alexia Jacquot",
        },
      ],
    },
  ],
};

VideoItem.displayName = "VideoItem";
export default VideoItem;
