(function attachShadowRoots(root) {
  root.querySelectorAll("template[shadowrootmode]").forEach(template => {
    const mode = template.getAttribute("shadowrootmode");
    const shadowRoot = template.parentNode.attachShadow({ mode });
    shadowRoot.appendChild(template.content);
    template.remove();
    attachShadowRoots(shadowRoot);
  });
})(window.document);

class AppRoot extends HTMLElement {
  constructor() {
    super();
    const formElement = this.shadowRoot.querySelector("form");
    const titleInputElement =
      formElement.querySelector('input[type="text"]');
    const fileInputElement =
      formElement.querySelector('input[type="file"]');
    const urlInputElement =
      formElement.querySelector('input[type="url"]');
    const inputElements = [
      titleInputElement,
      fileInputElement,
      urlInputElement,
    ];

    function handleInput(event) {
      const inputElement = event.target;
      const value = inputElement.value;

      if (value) {
        inputElement.removeAttribute("aria-invalid");
      }
    }

    for (const inputElement of inputElements) {
      inputElement.addEventListener("input", handleInput);
    }

    const handleNavigation = () => {
      if (window.location.href.includes("?url=")) {
        const metaRefreshElement = window.document.createElement("meta");
        metaRefreshElement.setAttribute("http-equiv", "refresh");
        metaRefreshElement.setAttribute(
          "content",
          `0;url=${window.location.href.split("?url=")[1]}`
        );
        window.document.head.append(metaRefreshElement);
      } else {
        const priorManifestLinkElement = window.document.querySelector(
          "link[rel='manifest']"
        );

        if (priorManifestLinkElement) {
          window.location.reload();
        }

        this.setAttribute(
          "class",
          "is-showing-step is-showing-step--configuration"
        );

        const iconLinkElement = window.document.createElement("link");
        iconLinkElement.setAttribute("rel", "apple-touch-icon");

        fileInputElement.addEventListener("change", () => {
          const file = fileInputElement.files[0];
          const reader = new FileReader();

          reader.addEventListener("load", () => {
            iconLinkElement.href = reader.result;
          });

          if (file) {
            // Convert image file to base64 string.
            reader.readAsDataURL(file);
          }
        });

        formElement.addEventListener("submit", (event) => {
          event.preventDefault();

          const invalidElements = inputElements.filter(
            (InputElement) => !InputElement.validity.valid
          );

          if (invalidElements.length) {
            for (const InputElement of inputElements) {
              InputElement.setAttribute("aria-invalid", "false");
            }

            for (const invalidElement of invalidElements) {
              invalidElement.setAttribute("aria-invalid", "true");
            }

            return;
          }

          const startUrl = `/?url=${urlInputElement.value}`;
          const manifestDataUri = `data:application/manifest+json;charset=utf-8,${encodeURIComponent(
            JSON.stringify({
              name: titleInputElement.value || "",
              short_name: titleInputElement.value || "",
              start_url: startUrl,
              display: "standalone",
              background_color: "#000000",
              theme_color: "#000000",
            })
          )}`;

          const manifestLinkElement =
            window.document.createElement("link");
          manifestLinkElement.setAttribute("rel", "manifest");
          manifestLinkElement.setAttribute("href", manifestDataUri);

          if (iconLinkElement.href) {
            window.document.head.append(iconLinkElement);
          }

          if (titleInputElement.value) {
            window.document.title = titleInputElement.value;
          }

          window.document.head.append(manifestLinkElement);
          this.setAttribute(
            "class",
            "is-showing-step is-showing-step--add-to-homescreen"
          );
          window.history.pushState({}, "", startUrl);
          window.scrollTo(0, 0);
        });
      }
    };

    handleNavigation();

    window.addEventListener("popstate", handleNavigation);
  }
}

window.customElements.define("app-root", AppRoot);