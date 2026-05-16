if (typeof window !== 'undefined') {

  function isNativeScrollArea(el: HTMLElement | null, deltaY: number): boolean {
    let node = el;
    while (node && node !== document.body && node !== document.documentElement) {
      if (node.hasAttribute('data-native-scroll')) {
        return true;
      }
      
      const style = window.getComputedStyle(node);
      const isScrollable = /(auto|scroll)/.test(style.overflowY);
      
      if (isScrollable) {
        const { scrollTop, scrollHeight, clientHeight } = node;
        const canScrollUp = scrollTop > 0;
        const canScrollDown = scrollTop + clientHeight < scrollHeight - 1;

        if (deltaY === 0) return canScrollUp || canScrollDown;
        if (deltaY > 0 && canScrollDown) return true;
        if (deltaY < 0 && canScrollUp) return true;
      }
      
      node = node.parentElement;
    }
    return false;
  }

  class GlobalSmoothScroller {
    private targetY = 0;
    private currentY = 0;
    private startY = 0;
    private startTime = 0;
    private isAnimating = false;
    private readonly baseDuration = 1200;
    private readonly raf: FrameRequestCallback;

    constructor() {
      this.raf = this.animate.bind(this);

      // ✅ KEY FIX: capture:true intercepts BEFORE browser default scroll
      // ✅ passive:false allows preventDefault() to actually block native scroll
      document.addEventListener('wheel', this.onWheel.bind(this), {
        capture: true,
        passive: false,
      });

      document.addEventListener('keydown', this.onKeyDown.bind(this), {
        capture: true,
        passive: false,
      });

      // Sync currentY/targetY if user scrolls via scrollbar or programmatically
      window.addEventListener('scroll', () => {
        if (!this.isAnimating) {
          this.currentY = window.scrollY;
          this.targetY = window.scrollY;
        }
      }, { passive: true });

      // Init from current scroll position
      this.currentY = window.scrollY;
      this.targetY = window.scrollY;
    }

    private easing(t: number): number {
      return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    private scaledDuration(distancePx: number): number {
      const ratio = Math.abs(distancePx) / (window.innerHeight * 0.5);
      return Math.min(this.baseDuration, Math.max(300, this.baseDuration * ratio));
    }

    private scroll(delta: number) {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const newTarget = Math.max(0, Math.min(this.targetY + delta, maxScroll));
      if (newTarget === this.targetY) return;

      this.targetY = newTarget;
      this.startY = this.currentY;
      this.startTime = performance.now();

      if (!this.isAnimating) {
        this.isAnimating = true;
        requestAnimationFrame(this.raf);
      }
    }

    private onWheel(e: WheelEvent) {
      const target = e.target as HTMLElement;

      // Normalize delta
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 40;
      if (e.deltaMode === 2) delta *= 800;

      // Let nested scrollable containers handle their own scroll
      if (isNativeScrollArea(target, delta)) return;

      // ✅ This is what actually hijacks the scroll
      e.preventDefault();
      e.stopPropagation();

      this.scroll(delta);
    }

    private onKeyDown(e: KeyboardEvent) {
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.isContentEditable ||
          isNativeScrollArea(active, 0))
      ) return;

      const LINE = 80;
      const PAGE = window.innerHeight * 0.9;
      const map: Record<string, number> = {
        ArrowDown: LINE,
        ArrowUp: -LINE,
        PageDown: PAGE,
        PageUp: -PAGE,
        End: document.documentElement.scrollHeight,
        Home: -document.documentElement.scrollHeight,
      };

      if (!(e.key in map)) return;
      e.preventDefault();
      this.scroll(map[e.key]);
    }

    private animate(now: number) {
      if (!this.isAnimating) return;

      const distance = this.targetY - this.startY;
      const duration = this.scaledDuration(distance);
      const elapsed = now - this.startTime;
      const progress = Math.min(elapsed / duration, 1);

      this.currentY = this.startY + distance * this.easing(progress);
      window.scrollTo(0, this.currentY);

      if (progress < 1) {
        requestAnimationFrame(this.raf);
      } else {
        this.currentY = this.targetY;
        window.scrollTo(0, this.currentY);
        this.isAnimating = false;
      }
    }
  }

  if (!(window as any).__SMOOTH_SCROLL_INIT__) {
    new GlobalSmoothScroller();
    (window as any).__SMOOTH_SCROLL_INIT__ = true;
  }
}

export const initSmoothScroll = () => { };