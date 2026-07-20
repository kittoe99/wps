FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash curl jq ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/wps
COPY cli/wps-publish.mjs /usr/local/bin/wps-publish.mjs
COPY cli/wps-research.mjs /usr/local/bin/wps-research.mjs
COPY cli/wps-search.mjs /usr/local/bin/wps-search.mjs
COPY cli/wps-crawl.mjs /usr/local/bin/wps-crawl.mjs
COPY cli/wps-screenshot.mjs /usr/local/bin/wps-screenshot.mjs
COPY cli/wps-diff.mjs /usr/local/bin/wps-diff.mjs
RUN printf '#!/bin/sh\nexec node /usr/local/bin/wps-publish.mjs "$@"\n' > /usr/local/bin/wps-publish \
  && printf '#!/bin/sh\nexec node /usr/local/bin/wps-research.mjs "$@"\n' > /usr/local/bin/wps-research \
  && printf '#!/bin/sh\nexec node /usr/local/bin/wps-search.mjs "$@"\n' > /usr/local/bin/wps-search \
  && printf '#!/bin/sh\nexec node /usr/local/bin/wps-crawl.mjs "$@"\n' > /usr/local/bin/wps-crawl \
  && printf '#!/bin/sh\nexec node /usr/local/bin/wps-screenshot.mjs "$@"\n' > /usr/local/bin/wps-screenshot \
  && printf '#!/bin/sh\nexec node /usr/local/bin/wps-diff.mjs "$@"\n' > /usr/local/bin/wps-diff \
  && chmod +x /usr/local/bin/wps-publish /usr/local/bin/wps-research \
     /usr/local/bin/wps-search /usr/local/bin/wps-crawl /usr/local/bin/wps-screenshot \
     /usr/local/bin/wps-diff

RUN mkdir -p /workspace && chown -R node:node /workspace
USER node
WORKDIR /workspace

ENV PLATFORM_API_URL=""
ENV PLATFORM_API_TOKEN=""
ENV FIRECRAWL_API_KEY=""

CMD ["bash"]
