const map = (value, start1, stop1, start2, stop2) => {
  return ((value - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
};

export class MyScrollbar {
  constructor({
    container,
    thumb,
    direction = 'vertical',
    lenis,
    autoFade = 200, // 動かしてないときに自動で消える（ms）
  }) {
    if (direction !== 'vertical' && direction !== 'horizontal') {
      throw new Error('invalid direction');
    }

    this.isVertical = direction === 'vertical';
    this.autoFade = autoFade;
    this.lenis = lenis;
    this.containerEl = container;
    this.thumbEl = thumb;

    this.isHover = false;
    this.isHandling = false;
    this.isMoving = false;
    this.prevTranslate = 0;
    this.fadeTimeoutId = 0;
    this.isExist = false;

    this.thumbRatio = 0;
    this.thumbLength = 0;
    this.maxScroll = 0;
    this.setSize();

    this.containerEl.addEventListener('mouseenter', this.handleMouseEnter);
    this.containerEl.addEventListener('mouseleave', this.handleMouseLeave);
    this.containerEl.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp); // 掴んだまま画面外にカーソルが外れた場合などに対応したいので、ここだけwindow
  }

  getScrollTarget = (target) => {
    return map(
      target,
      0 + this.thumbLength * 0.5,
      (this.isVertical ? window.innerHeight : window.innerWidth) -
        this.thumbLength * 0.5,
      0,
      this.maxScroll
    );
  };

  getTranslate = (target) => {
    return map(
      target,
      0,
      this.maxScroll,
      0,
      (this.isVertical ? window.innerHeight : window.innerWidth) *
        (1.0 - this.thumbRatio)
    );
  };

  handleMouseEnter = () => {
    this.isHover = true;
    document.body.style.cursor = 'grab';
  };

  handleMouseLeave = () => {
    document.body.style.cursor = 'auto';
    this.isHover = false;
  };

  handleMouseDown = (e) => {
    this.isHandling = true;

    // 動かす間、テキスト等を選択してしまわないように
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';

    // 押したところにスクロールを移動
    const mouse = this.isVertical ? e.clientY : e.clientX;
    const target = this.getScrollTarget(mouse);
    if (this.lenis) {
      this.lenis.scrollTo(target);
    } else {
      window.scrollTo(
        this.isVertical ? 0 : target,
        this.isVertical ? target : 0
      );
    }

    window.addEventListener('mousemove', this.handleMouseMove);
  };

  handleMouseMove = (e) => {
    const mouse = this.isVertical ? e.clientY : e.clientX;
    const target = this.getScrollTarget(mouse);

    if (this.lenis) {
      this.lenis.scrollTo(target);
    } else {
      window.scrollTo(
        this.isVertical ? 0 : target,
        this.isVertical ? target : 0
      );
    }
  };

  handleMouseUp = () => {
    window.removeEventListener('mousemove', this.handleMouseMove);
    this.isHandling = false;

    // only pointer
    if (typeof window.ontouchstart !== 'undefined') return;

    document.body.style.userSelect = 'auto';
    document.body.style.cursor = this.isHover ? 'grab' : 'auto';
  };

  setSize = () => {
    const thumbRatio = this.isVertical
      ? window.innerHeight / document.body.scrollHeight
      : window.innerWidth / document.body.scrollWidth;

    // スクロールできる高さがない場合は非表示に
    this.isExist = thumbRatio < 1;

    this.thumbRatio = thumbRatio;

    this.thumbLength = this.isVertical
      ? thumbRatio * window.innerHeight
      : thumbRatio * window.innerWidth;

    this.maxScroll = this.isVertical
      ? document.body.scrollHeight - window.innerHeight
      : document.body.scrollWidth - window.innerWidth;

    if (this.isVertical) {
      this.thumbEl.style.height = `${thumbRatio * 100}%`;
    } else {
      this.thumbEl.style.width = `${thumbRatio * 100}%`;
    }
  };

  raf = () => {
    if (this.isExist) {
      if (this.containerEl.style.display === 'none') {
        this.containerEl.style.display === '';
      }
    } else {
      if (this.containerEl.style.display !== 'none') {
        this.containerEl.style.display = 'none';
      }

      return;
    }

    const currentScroll = this.isVertical ? window.scrollY : window.scrollX;

    const translate = this.getTranslate(currentScroll);

    this.thumbEl.style.transform = this.isVertical
      ? `translate3d(0, ${translate}px, 0)`
      : `translate3d(${translate}px, 0, 0)`;

    // 動いているとき、あるいは触っているときだけ表示
    if (this.autoFade > 0) {
      if (translate !== this.prevTranslate && this.prevTranslate !== 0) {
        if (!this.isMoving) {
          this.isMoving = true;
        }

        // 前フレームとの差を取っても誤差がでてチラつくので、timerを使う
        clearTimeout(this.fadeTimeoutId);
        this.fadeTimeoutId = setTimeout(() => {
          this.isMoving = false;
        }, this.autoFade);
      }

      const isVisible = this.isHover || this.isHandling || this.isMoving;

      this.containerEl.setAttribute('data-visible', isVisible);
    }

    this.prevTranslate = translate;
  };

  resize = () => {
    this.setSize();
  };
}
