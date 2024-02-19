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

    this.thumbLength = 0;
    this.thumbMinLength = 40; // 画面が小さいときにスクロールバーが小さくなりすぎて消えるのを防ぐ
    this.maxScroll = 0;

    this.isHover = false;
    this.isHandling = false;
    this.isMoving = false;
    this.isExist = false;

    // directionによって使い分ける頻出のプロパティを保持しておく
    this.windowInnerSizeProp = this.isVertical ? 'innerHeight' : 'innerWidth';
    this.bodyScrollSizeProp = this.isVertical ? 'scrollHeight' : 'scrollWidth';

    this.prevTranslate = 0;
    this.prevWindowSize = 0;
    this.prevScrollSize = 0;

    this.fadeTimeoutId = 0;

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
      window[this.windowInnerSizeProp] - this.thumbLength * 0.5,
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
      window[this.windowInnerSizeProp] - this.thumbLength
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
    const thumbRatio =
      window[this.windowInnerSizeProp] / document.body[this.bodyScrollSizeProp];

    // スクロールできる高さがない場合は非表示に
    this.isExist = thumbRatio < 1;
    if (this.isExist) {
      this.containerEl.style.display = '';
    } else {
      this.containerEl.style.display = 'none';
    }

    this.thumbLength = Math.max(
      thumbRatio * window[this.windowInnerSizeProp],
      this.thumbMinLength
    );

    this.maxScroll =
      document.body[this.bodyScrollSizeProp] - window[this.windowInnerSizeProp];

    if (this.isVertical) {
      this.thumbEl.style.height = `${this.thumbLength}px`;
    } else {
      this.thumbEl.style.width = `${this.thumbLength}px`;
    }
  };

  raf = () => {
    // 長さを変更する必要があるか確認
    if (
      window[this.windowInnerSizeProp] !== this.prevWindowSize ||
      document.body[this.bodyScrollSizeProp] !== this.prevScrollSize
    ) {
      this.resize();
    }

    this.prevScrollSize = document.body[this.bodyScrollSizeProp];
    this.prevWindowSize = window[this.windowInnerSizeProp];

    if (!this.isExist) return;

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
