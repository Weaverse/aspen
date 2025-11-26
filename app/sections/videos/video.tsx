import type {
  HydrogenComponent,
  WeaverseBlog,
  WeaverseVideo,
} from "@weaverse/hydrogen";
import { forwardRef, lazy, Suspense } from "react";
import { Link } from "react-router";

const ReactPlayer = lazy(() => import("react-player"));

const VideoPlaceholder = () => (
  <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-gray-100">
    <div className="flex flex-col items-center gap-4 text-gray-400">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M10 8L16 12L10 16V8Z" fill="currentColor" />
        <path
          d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12Z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <p className="font-medium text-sm">No Video</p>
    </div>
  </div>
);

interface VideoItemProps {
  video: WeaverseVideo;
  date: string;
  author: string;
  videoTitle: string;
  videoHandle: WeaverseBlog;
  contentBackgroundColor?: string;
}

let VideoItem = forwardRef<HTMLElement, VideoItemProps>((props, ref) => {
  let { video, date, author, videoTitle, videoHandle, contentBackgroundColor } =
    props;

  const Tag = videoHandle?.handle ? Link : "div";
  const hasVideo = video?.url?.trim();

  return (
    <div
      ref={ref as any}
      className="flex aspect-(--aspect-ratio) h-full w-full flex-col"
    >
      <Tag to={`/blogs/${videoHandle?.handle}`} className="flex h-full w-full">
        <div className="relative h-full w-full overflow-hidden">
          {hasVideo ? (
            <div className="absolute inset-0 h-full w-full">
              <Suspense fallback={<VideoPlaceholder />}>
                <ReactPlayer
                  url={video.url}
                  loop={true}
                  width="100%"
                  height="100%"
                  controls={false}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  config={{
                    file: {
                      attributes: {
                        style: {
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        },
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
                        modestbranding: 1,
                        rel: 0,
                      },
                      embedOptions: {
                        width: "100%",
                        height: "100%",
                      },
                    },
                  }}
                />
              </Suspense>
            </div>
          ) : (
            <VideoPlaceholder />
          )}
          <div
            className="absolute right-0 bottom-0 left-0 p-3"
            style={{
              backgroundColor:
                contentBackgroundColor || "rgba(211,195,167,0.9)",
            }}
          >
            <div className="flex flex-col gap-1">
              <p className="font-open-sans font-semibold text-[#29231E] text-sm leading-[1.6] tracking-[0.02em]">
                {videoTitle}
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
          type: "text",
          name: "videoTitle",
          label: "Video title",
          defaultValue: "Video title",
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
        {
          type: "color",
          name: "contentBackgroundColor",
          label: "Content background color",
          defaultValue: "rgba(211,195,167,0.9)",
        },
      ],
    },
  ],
};

VideoItem.displayName = "VideoItem";
export default VideoItem;
