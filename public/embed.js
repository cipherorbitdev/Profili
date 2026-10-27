(() => {
  const script = document.currentScript;
  const origin = script instanceof HTMLScriptElement ? new URL(script.src).origin : window.location.origin;
  const nodes = document.querySelectorAll("[data-profili-slug]");

  nodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.getAttribute("data-profili-ready")) return;
    const slug = node.getAttribute("data-profili-slug");
    if (!slug) return;

    node.setAttribute("data-profili-ready", "1");
    const iframe = document.createElement("iframe");
    iframe.src = `${origin}/participant/${encodeURIComponent(slug)}?embed=1`;
    iframe.title = "Profili voice agent";
    iframe.allow = "microphone; autoplay";
    iframe.style.width = "100%";
    iframe.style.maxWidth = "400px";
    iframe.style.height = "640px";
    iframe.style.border = "0";
    iframe.style.borderRadius = "16px";
    node.appendChild(iframe);
  });
})();
