import { MyScrollbar } from './scrollbar';
import './style.css';

// -----------------

const scrollbar = new MyScrollbar({
  container: document.querySelector('[data-scrollbar="container"]'),
  thumb: document.querySelector('[data-scrollbar="thumb"]'),
});

const raf = () => {
  scrollbar.raf();
  requestAnimationFrame(raf);
};

raf();
