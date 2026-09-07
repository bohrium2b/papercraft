FROM ruby:3.4-bookworm

LABEL maintainer="papercraft-dev"

ARG DEBIAN_FRONTEND=noninteractive
ARG NODE_VERSION=20
ARG PNPM_VERSION=9

ENV LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    BUNDLE_JOBS=4 \
    BUNDLE_RETRY=3 \
    RAILS_ENV=development

# System dependencies: build tools, DB clients, image libs, VCS, networking
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    curl \
    wget \
    ca-certificates \
    gnupg \
    pkg-config \
    libssl-dev \
    libreadline-dev \
    zlib1g-dev \
    libyaml-dev \
    libxml2-dev \
    libxslt1-dev \
    libffi-dev \
    libgdbm-dev \
    libncurses5-dev \
    libpq-dev \
    postgresql-client \
    redis-tools \
    imagemagick \
    libvips \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# Node.js + pnpm for Vite/React frontend
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get update && apt-get install -y --no-install-recommends nodejs \
    && npm install -g pnpm@${PNPM_VERSION} \
    && rm -rf /var/lib/apt/lists/*

# TeX Live (minimal) for Prawn + LaTeX + dvisvgm/TikZ pipeline
# Installs: pdflatex, latex, dvisvgm, dvipng, and common packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-science \
    texlive-latex-recommended \
    texlive-pictures \
    texlive-publishers \
    texlive-fonts-extra \
    dvisvgm \
    && rm -rf /var/lib/apt/lists/*

# Prepare app directory
RUN mkdir -p /app
WORKDIR /app

# Pre-install bundler to speed up later bundle install
RUN gem update --system && gem install bundler

# Optional: keep this image lean; bundle install will run in postCreateCommand
CMD ["/bin/bash"]
