import type {
  ComponentLoaderArgs,
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from '@weaverse/hydrogen';
import {forwardRef, useEffect, useRef, useState} from 'react';

type WeaverseImage = {
  id: string;
  url: string;
  altText: string;
  width: number;
  height: number;
};

type BeforeAfterSliderData = {
  beforeImage: WeaverseImage;
  afterImage: WeaverseImage;
  sliderPosition: number;
};

type BeforeAfterSliderProps = HydrogenComponentProps<
  Awaited<ReturnType<typeof loader>>
> &
  BeforeAfterSliderData;

let BeforeAfterSlider = forwardRef<HTMLElement, BeforeAfterSliderProps>(
  (props, ref) => {
    let {beforeImage, afterImage, sliderPosition = 50, ...rest} = props;
    const sliderRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);

    useEffect(() => {
      const slider = sliderRef.current;
      if (slider) {
        slider.style.setProperty('--position', `${sliderPosition}%`);
      }
    }, [sliderPosition]);

    useEffect(() => {
      const slider = sliderRef.current;
      if (!slider) return;

      const handleStart = (e: MouseEvent | TouchEvent) => {
        setIsDragging(true);
        setShowOverlay(true);
        if (e.type === 'touchstart') {
          document.addEventListener('touchmove', handleSlide);
          document.addEventListener('touchend', handleEnd);
        }
      };

      const handleEnd = () => {
        setIsDragging(false);
        setShowOverlay(false);
        document.removeEventListener('touchmove', handleSlide);
        document.removeEventListener('touchend', handleEnd);
      };

      const handleSlide = (e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;
        requestAnimationFrame(() => {
          const rect = slider.getBoundingClientRect();
          const clientX =
            e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
          const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
          const percent = (x / rect.width) * 100;
          slider.style.setProperty('--position', `${percent}%`);
        });
      };

      slider.addEventListener('mousedown', handleStart);
      slider.addEventListener('touchstart', handleStart);
      document.addEventListener('mousemove', handleSlide);
      document.addEventListener('mouseup', handleEnd);

      return () => {
        slider.removeEventListener('mousedown', handleStart);
        slider.removeEventListener('touchstart', handleStart);
        document.removeEventListener('mousemove', handleSlide);
        document.removeEventListener('mouseup', handleEnd);
      };
    }, [isDragging]);

    return (
      <section ref={ref} {...rest}>
        <div
          ref={sliderRef}
          className="image-comparison-slider"
          style={{
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            height: '400px',
          }}
        >
          {showOverlay && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 10,
              }}
            />
          )}
          <img
            src={afterImage.url}
            alt="After"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <img
            src={beforeImage.url}
            alt="Before"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              clipPath: 'inset(0 calc(100% - var(--position)) 0 0)',
            }}
          />
          <div
            className="slider-handle"
            style={{
              position: 'absolute',
              top: '50%',
              left: 'var(--position)',
              width: '40px',
              height: '40px',
              background: 'transparent',
              cursor: 'ew-resize',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div
              style={{width: '2px', height: '100%', background: 'white'}}
            ></div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </section>
    );
  },
);

export let loader = async (
  args: ComponentLoaderArgs<BeforeAfterSliderData>,
) => {
  // Data fetching logic, if needed
};

export let schema: HydrogenComponentSchema = {
  type: 'before-after-slider-type',
  title: 'Image Comparison Slider',

  inspector: [
    {
      group: 'Image Comparison',
      inputs: [
        {
          type: 'image',
          label: 'Before Image',
          name: 'beforeImage',
          defaultValue: '',
        },
        {
          type: 'image',
          label: 'After Image',
          name: 'afterImage',
          defaultValue: '',
        },
      ],
    },
  ],
};

export default BeforeAfterSlider;
