import { useEffect, useRef } from "react";

interface Fruit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  image: HTMLImageElement;
  size: number;
}

export default function AnimatedLogo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fruitsRef = useRef<Fruit[]>([]);
  const imagesLoadedRef = useRef(0);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const width = 300;
    const height = 300;
    canvas.width = width;
    canvas.height = height;

    const centerX = width / 2;
    const centerY = height / 2;

    const fruitImages = [
      "/assets/generated/apple-tile-transparent.dim_128x128.png",
      "/assets/generated/orange-tile-transparent.dim_128x128.png",
      "/assets/generated/banana-tile-transparent.dim_128x128.png",
      "/assets/generated/grape-tile-transparent.dim_128x128.png",
      "/assets/generated/strawberry-tile-transparent.dim_128x128.png",
      "/assets/generated/cherry-tile-transparent.dim_128x128.png",
    ];

    const fruits: Fruit[] = [];

    fruitImages.forEach((src, index) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        imagesLoadedRef.current++;
        if (imagesLoadedRef.current === fruitImages.length) {
          startAnimation();
        }
      };

      const angle = (index / fruitImages.length) * Math.PI * 2;
      const radius = 80;

      fruits.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        angle: 0,
        angularVelocity: (Math.random() - 0.5) * 0.08,
        image: img,
        size: 48,
      });
    });

    fruitsRef.current = fruits;

    function animate() {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, width, height);

      for (const fruit of fruitsRef.current) {
        // Update position
        fruit.x += fruit.vx;
        fruit.y += fruit.vy;

        // Gravity towards center
        const dx = centerX - fruit.x;
        const dy = centerY - fruit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 10) {
          fruit.vx += (dx / distance) * 0.08;
          fruit.vy += (dy / distance) * 0.08;
        }

        // Damping
        fruit.vx *= 0.98;
        fruit.vy *= 0.98;

        // Rotation
        fruit.angle += fruit.angularVelocity;

        // Draw fruit
        ctx.save();
        ctx.translate(fruit.x, fruit.y);
        ctx.rotate(fruit.angle);
        ctx.drawImage(
          fruit.image,
          -fruit.size / 2,
          -fruit.size / 2,
          fruit.size,
          fruit.size,
        );
        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    function startAnimation() {
      animate();
    }

    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="drop-shadow-2xl"
      style={{ width: "300px", height: "300px" }}
    />
  );
}
