<script lang="ts">
  import { onMount } from 'svelte';
  
  let {
    slides = [],
    loop = true,
    showArrows = true,
    showDots = true,
    autoPlay = true, // مفعل افتراضياً
    autoPlayInterval = 4000 // 4 ثواني
  }: {
    slides?: Array<{
      image: string;
      bgGradient?: string;
      title?: string;
      badge?: { text: string; position: string } | null;
    }>;
    loop?: boolean;
    showArrows?: boolean;
    showDots?: boolean;
    autoPlay?: boolean;
    autoPlayInterval?: number;
  } = $props();
  
  // State
  let currentIndex = $state(0);
  let trackElement = $state<HTMLElement | null>(null);
  let startX = $state(0);
  let dragging = $state(false);
  let autoPlayTimer = $state<ReturnType<typeof setInterval> | null>(null);
  let userInteracted = $state(false); // باش نعرفو واش الزبون تفاعل
  
  // Computed
  let totalSlides = $derived(slides.length);
  let trackTransform = $derived(`translateX(-${currentIndex * 100}%)`);
  
  // Methods
  function goTo(index: number) {
    if (totalSlides === 0) return;
    if (loop) {
      currentIndex = (index + totalSlides) % totalSlides;
    } else {
      currentIndex = Math.max(0, Math.min(index, totalSlides - 1));
    }
  }
  
  function goToNext() {
    goTo(currentIndex + 1);
  }
  
  function goToPrev() {
    goTo(currentIndex - 1);
  }
  
  // توقيف التمرير التلقائي نهائياً فاش كيتفاعل الزبون
  function handleUserInteraction() {
    userInteracted = true;
    stopAutoPlay();
  }

  // Swipe handlers
  function handleTouchStart(e: TouchEvent) {
    handleUserInteraction();
    startX = e.touches[0].clientX;
    dragging = true;
  }
  
  function handleTouchEnd(e: TouchEvent) {
    if (!dragging) return;
    dragging = false;
    
    const deltaX = e.changedTouches[0].clientX - startX;
    const threshold = 50;
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  }
  
  // Keyboard navigation
  function handleKeyDown(e: KeyboardEvent) {
    handleUserInteraction();
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrev(); // For RTL this might be goToNext depending on exact layout, but keeping logic consistent with their code
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNext();
    }
  }
  
  function handleManualClick(action: () => void) {
    handleUserInteraction();
    action();
  }

  // Auto-play
  function startAutoPlay() {
    if (autoPlay && totalSlides > 1 && !userInteracted) {
      stopAutoPlay();
      autoPlayTimer = setInterval(goToNext, autoPlayInterval);
    }
  }
  
  function stopAutoPlay() {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
  }
  
  onMount(() => {
    startAutoPlay();
    
    return () => {
      stopAutoPlay();
    };
  });
</script>

<div class="carousel-container" dir="ltr">
  <div 
    class="carousel" 
    role="region" 
    aria-label="Product image carousel"
    tabindex="0"
    onkeydown={handleKeyDown}
  >
    <div 
      class="carousel-track" 
      bind:this={trackElement}
      style="transform: {trackTransform}"
      ontouchstart={handleTouchStart}
      ontouchend={handleTouchEnd}
      role="list"
    >
      {#each slides as slide, index}
        <div 
          class="carousel-slide" 
          style="background: {slide.bgGradient || '#f0f0f0'}"
          role="listitem"
          aria-label="Slide {index + 1} of {totalSlides}"
          aria-hidden={currentIndex !== index}
        >
          {#if slide.image}
            <img 
              src={slide.image} 
              alt={slide.title || `Slide ${index + 1}`}
              class="slide-image"
            />
          {/if}
          
          {#if slide.title}
            <div class="slide-content">
              <h3 class="slide-title">{slide.title}</h3>
            </div>
          {/if}
          
          {#if slide.badge && slide.badge.text}
            <div class="demo-badge {slide.badge.position || 'top-right'}">
              {@html slide.badge.text}
            </div>
          {/if}
        </div>
      {/each}
    </div>
    
    {#if showArrows && totalSlides > 1}
      <button 
        class="carousel-arrow prev" 
        onclick={() => handleManualClick(goToPrev)}
        aria-label="Previous slide"
        disabled={!loop && currentIndex === 0}
      >
        <span aria-hidden="true">‹</span>
      </button>
      
      <button 
        class="carousel-arrow next" 
        onclick={() => handleManualClick(goToNext)}
        aria-label="Next slide"
        disabled={!loop && currentIndex === totalSlides - 1}
      >
        <span aria-hidden="true">›</span>
      </button>
    {/if}
    
    {#if autoPlay && !userInteracted}
      <div class="progress-bar">
        <div 
          class="progress-bar-fill"
          style="animation: progress {autoPlayInterval}ms linear infinite"
        ></div>
      </div>
    {/if}
  </div>
  
  {#if showDots && totalSlides > 1}
    <div class="carousel-dots" role="tablist" aria-label="Slide navigation">
      {#each slides as slide, index}
        <button
          class="carousel-dot"
          class:active={currentIndex === index}
          onclick={() => handleManualClick(() => goTo(index))}
          role="tab"
          aria-selected={currentIndex === index}
          aria-label={`Go to slide ${index + 1}`}
          tabindex={currentIndex === index ? 0 : -1}
        ></button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .carousel-container {
    --carousel-radius: 20px;
    --dot-size: 7px;
    --dot-color-inactive: rgba(0, 0, 0, 0.18);
    --dot-color-active: #1a1a1a;
    --arrow-bg: rgba(255, 255, 255, 0.92);
    --arrow-fg: #1a1a1a;
    --transition-speed: 0.35s;
    
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  
  .carousel {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: var(--carousel-radius);
    overflow: hidden;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
  }
  
  .carousel:focus-visible {
    outline: 2px solid #0066cc;
    outline-offset: 2px;
  }
  
  .carousel-track {
    display: flex;
    height: 100%;
    transition: transform var(--transition-speed) cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
  }
  
  .carousel-slide {
    flex: 0 0 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    text-align: center;
    overflow: hidden;
  }
  
  .slide-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .slide-content {
    position: relative;
    z-index: 1;
    padding: 24px;
  }
  
  .slide-title {
    font-size: 14px;
    font-weight: 600;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    margin: 0;
  }
  
  .carousel-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--arrow-bg);
    color: var(--arrow-fg);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 18px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
    z-index: 2;
    opacity: 0.85;
  }
  
  .carousel-arrow:hover {
    background: #fff;
    opacity: 1;
    transform: translateY(-50%) scale(1.05);
  }
  
  .carousel-arrow:active {
    transform: translateY(-50%) scale(0.95);
  }
  
  .carousel-arrow:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  .carousel-arrow.prev {
    left: 12px;
  }
  
  .carousel-arrow.next {
    right: 12px;
  }
  
  .carousel-dots {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    margin-top: 14px;
    padding: 4px;
  }
  
  .carousel-dot {
    width: var(--dot-size);
    height: var(--dot-size);
    border-radius: 50%;
    background: var(--dot-color-inactive);
    border: none;
    padding: 0;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }
  
  .carousel-dot:hover {
    background: rgba(0, 0, 0, 0.4);
  }
  
  .carousel-dot.active {
    background: var(--dot-color-active);
    transform: scale(1.5);
  }
  
  .carousel-dot:focus-visible {
    outline: 2px solid #0066cc;
    outline-offset: 2px;
  }
  
  .demo-badge {
    position: absolute;
    width: 62px;
    height: 62px;
    border-radius: 50%;
    background: #fff;
    color: #1a1a1a;
    border: 2px dashed #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 9px;
    font-weight: 800;
    line-height: 1.2;
    padding: 4px;
    z-index: 1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .demo-badge.top-right {
    top: 14px;
    right: 14px;
  }
  
  .demo-badge.top-left {
    top: 14px;
    left: 14px;
  }
  
  .demo-badge.bottom-right {
    bottom: 14px;
    right: 14px;
  }
  
  .demo-badge.bottom-left {
    bottom: 14px;
    left: 14px;
  }
  
  .progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(255, 255, 255, 0.3);
    z-index: 2;
  }
  
  .progress-bar-fill {
    height: 100%;
    background: #fff;
  }
  
  @keyframes progress {
    from {
      width: 0%;
    }
    to {
      width: 100%;
    }
  }
  
  @media (max-width: 480px) {
    .carousel-arrow {
      width: 32px;
      height: 32px;
      font-size: 16px;
    }
    
    .demo-badge {
      width: 52px;
      height: 52px;
      font-size: 8px;
    }
  }
  
  @media (min-width: 768px) {
    .carousel {
      aspect-ratio: 4 / 3;
    }
    
    .carousel-arrow {
      width: 42px;
      height: 42px;
      font-size: 20px;
    }
  }
</style>
