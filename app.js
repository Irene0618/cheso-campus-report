(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const content = window.CHESO_CONTENT || { sections: [], slides: [] };
  const posterItems = [
    { title: '食堂鹅腿饭', src: 'poster-goose.png', file: '小题大作—鹅腿饭.png' },
    { title: '大学城流浪小咪', src: 'poster-cat.png', file: '小题大作—大学城流浪小咪.png' },
    { title: '同学们的洗澡水卡', src: 'poster-card.png', file: '小题大作—同学们的洗澡水卡.png' },
    { title: '校园创作计划主题海报', src: 'poster-concept.png', file: '小题大作—主题海报.png' }
  ];
  const slideNames = ['小题大作校园创作赛', '校园创作赛概览', '小题与大作', '活动邀请', '参赛选题示例', '参与流程', '点评与奖励', '招募与作品分享', '排期与分工', '预算与人力', '作品评审', '效果观察'];
  const slides = content.slides.map((texts, index) => ({ title: slideNames[index] || `提案第 ${index + 1} 页`, src: `slide-${String(index + 1).padStart(2, '0')}.png`, alt: texts.join('。') }));
  let slideIndex = 0;
  let documentIndex = 0;
  let viewerIndex = 0;
  let viewerType = 'posters';
  let toastTimer;

  function toast(text) {
    $('#toast').textContent = text;
    $('#toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3000);
  }

  const video = $('#campaign-video');
  $('#watch-film').addEventListener('click', async () => {
    if (window.innerWidth < 761) video.scrollIntoView({ behavior: 'smooth', block: 'center' });
    try { await video.play(); } catch (_) { toast('请点击视频画面中的播放按钮。'); }
  });
  video.addEventListener('error', () => toast('视频暂时无法播放，请使用“下载原片”打开。'));
  video.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(video.duration)) {
      const seconds = Math.round(video.duration);
      $('#video-duration').textContent = `${Math.floor(seconds / 60)}′${String(seconds % 60).padStart(2, '0')}″`;
    }
  });
  video.addEventListener('play', () => $('#watch-film').innerHTML = '<span aria-hidden="true">▷</span> 正在播放');
  video.addEventListener('pause', () => $('#watch-film').innerHTML = '<span aria-hidden="true">▶</span> 继续播放');
  video.addEventListener('ended', () => $('#watch-film').innerHTML = '<span aria-hidden="true">↻</span> 再看一次');

  $('#page-fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else toast('当前浏览器不支持全屏，可使用浏览器的放大功能。');
    } catch (_) { toast('当前窗口无法进入全屏，可直接使用页面导航汇报。'); }
  });
  document.addEventListener('fullscreenchange', () => {
    $('#page-fullscreen span').textContent = document.fullscreenElement ? '退出全屏' : '全屏汇报';
  });

  const navLinks = $$('.site-header nav a');
  const sections = $$('.section[id]');
  let scrollPending = false;
  function updateScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    $('#progress').style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    let active = sections[0]?.id;
    sections.forEach(section => { if (section.getBoundingClientRect().top <= 180) active = section.id; });
    navLinks.forEach(link => {
      const current = link.hash === `#${active}`;
      link.classList.toggle('active', current);
      if (current) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
    scrollPending = false;
  }
  window.addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  updateScroll();

  const dialog = $('#media-dialog');
  function viewerItems() { return viewerType === 'slides' ? slides : posterItems; }
  function renderViewer() {
    const items = viewerItems();
    const item = items[viewerIndex];
    $('#viewer-image').src = item.src;
    $('#viewer-image').alt = viewerType === 'slides' ? `提案第 ${viewerIndex + 1} 页，${item.alt}` : `${item.title}海报`;
    $('#viewer-title').textContent = item.title;
    $('#viewer-counter').textContent = `${String(viewerIndex + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    $('#viewer-canvas').classList.remove('zoomed');
    $('#viewer-canvas').scrollTo(0, 0);
    $('#viewer-zoom').textContent = '查看细节';
    $('#viewer-download').href = viewerType === 'slides' ? 'campaign-deck.pptx' : item.src;
    $('#viewer-download').download = viewerType === 'slides' ? 'Cheso_小题大作_校园创作赛提案.pptx' : item.file;
    $('#viewer-download').textContent = viewerType === 'slides' ? '下载 PPT' : '下载原图';
    $('#viewer-prev').disabled = viewerIndex === 0;
    $('#viewer-next').disabled = viewerIndex === items.length - 1;
    if (viewerType === 'slides') selectSlide(viewerIndex, false);
  }
  function openViewer(type, index) {
    viewerType = type;
    viewerIndex = index;
    renderViewer();
    dialog.showModal();
    $('#viewer-close').focus();
  }
  function changeViewer(step) {
    viewerIndex = Math.max(0, Math.min(viewerItems().length - 1, viewerIndex + step));
    renderViewer();
  }
  $$('[data-poster]').forEach(button => button.addEventListener('click', () => openViewer('posters', Number(button.dataset.poster))));
  $('#viewer-close').addEventListener('click', () => dialog.close());
  $('#viewer-prev').addEventListener('click', () => changeViewer(-1));
  $('#viewer-next').addEventListener('click', () => changeViewer(1));
  function toggleZoom() {
    const zoomed = $('#viewer-canvas').classList.toggle('zoomed');
    $('#viewer-zoom').textContent = zoomed ? '适应画面' : '查看细节';
  }
  $('#viewer-zoom').addEventListener('click', toggleZoom);
  $('#viewer-image').addEventListener('click', toggleZoom);
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); changeViewer(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); changeViewer(1); }
  });

  function selectSlide(index, scrollThumb = true) {
    if (!slides.length) return;
    slideIndex = Math.max(0, Math.min(slides.length - 1, index));
    $('#slide-image').src = slides[slideIndex].src;
    $('#slide-image').alt = `提案第 ${slideIndex + 1} 页：${slides[slideIndex].alt}`;
    $('#slide-count').textContent = `${String(slideIndex + 1).padStart(2, '0')} / ${slides.length}`;
    $('#slide-prev').disabled = slideIndex === 0;
    $('#slide-next').disabled = slideIndex === slides.length - 1;
    $$('.slide-thumb').forEach((button, index) => {
      button.classList.toggle('active', index === slideIndex);
      button.setAttribute('aria-pressed', String(index === slideIndex));
    });
    if (scrollThumb) {
      const selected = $$('.slide-thumb')[slideIndex];
      if (selected) {
        const row = $('#slide-thumbs');
        row.scrollTo({ left: selected.offsetLeft - row.offsetLeft - row.clientWidth / 2 + selected.clientWidth / 2, behavior: 'smooth' });
      }
    }
  }
  slides.forEach((slide, index) => {
    const button = document.createElement('button');
    button.className = 'slide-thumb';
    button.type = 'button';
    button.setAttribute('aria-label', `第 ${index + 1} 页，${slide.title}`);
    const image = document.createElement('img');
    image.src = slide.src;
    image.alt = '';
    image.loading = 'lazy';
    const label = document.createElement('span');
    label.textContent = String(index + 1).padStart(2, '0');
    button.append(image, label);
    button.addEventListener('click', () => selectSlide(index));
    $('#slide-thumbs').append(button);
  });
  $('#slide-prev').addEventListener('click', () => selectSlide(slideIndex - 1));
  $('#slide-next').addEventListener('click', () => selectSlide(slideIndex + 1));
  $('#open-slide').addEventListener('click', () => openViewer('slides', slideIndex));
  selectSlide(0, false);

  const tabs = $$('.plan-tabs [role=tab]');
  function activateTab(index, focus = false) {
    tabs.forEach((tab, n) => {
      tab.setAttribute('aria-selected', String(n === index));
      tab.tabIndex = n === index ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = n !== index;
    });
    if (focus) tabs[index].focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(index));
    tab.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); activateTab(1 - index, true); }
    });
  });

  function renderDocument(index, scroll = false) {
    if (!content.sections[index]) return;
    documentIndex = index;
    const section = content.sections[index];
    const container = $('#document-body');
    container.replaceChildren();
    const title = document.createElement('h3');
    title.textContent = section.title;
    container.append(title);
    section.blocks.forEach(block => {
      if (block.type === 'table') {
        const wrap = document.createElement('div');
        wrap.className = 'document-table-scroll';
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        block.rows.forEach((row, rowIndex) => {
          const tr = document.createElement('tr');
          row.forEach(text => {
            const td = document.createElement(rowIndex === 0 ? 'th' : 'td');
            td.textContent = text;
            if (rowIndex === 0) td.scope = 'col';
            tr.append(td);
          });
          (rowIndex === 0 ? thead : tbody).append(tr);
        });
        table.append(thead, tbody);
        wrap.append(table);
        container.append(wrap);
      } else {
        const p = document.createElement(block.type === 'heading' ? 'h4' : 'p');
        p.textContent = block.text;
        container.append(p);
      }
    });
    const pagination = document.createElement('div');
    pagination.className = 'document-pagination';
    [-1, 1].forEach(step => {
      const button = document.createElement('button');
      const next = content.sections[index + step];
      button.textContent = next ? (step < 0 ? '← ' : '') + next.title + (step > 0 ? ' →' : '') : (step < 0 ? '已是开篇' : '全文结束');
      button.disabled = !next;
      button.addEventListener('click', () => renderDocument(index + step, true));
      pagination.append(button);
    });
    container.append(pagination);
    $$('#document-toc button').forEach((button, n) => {
      button.classList.toggle('active', n === index);
      if (n === index) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current');
    });
    if (scroll) $('#panel-document').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  content.sections.forEach((section, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = section.title;
    button.addEventListener('click', () => renderDocument(index, true));
    $('#document-toc').append(button);
  });
  renderDocument(0);

  $('#copy-notes').addEventListener('click', async () => {
    const text = [...$('#message-text').querySelectorAll('p')].map(p => p.textContent).join('\n\n');
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      toast('已复制给老师的话');
    } catch (_) {
      const range = document.createRange();
      range.selectNodeContents($('#message-text'));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      toast('已选中这段话，请使用复制快捷键。');
    }
  });
})();
