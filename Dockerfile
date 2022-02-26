FROM ubuntu:21.10

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update
RUN apt-get install -y gnupg software-properties-common
RUN apt-get update && apt-get install -y \
    git \
    libcurl4-gnutls-dev \
    libgit2-dev \
	libopenblas-dev \
    libssl-dev \
    libxml2-dev \
    r-base \
    r-base-dev
ENV GSL_CBLAS_LIB=-lopenblas

RUN apt-get install -y nodejs yarn

RUN mkdir -p ~/.R && \
    echo 'MAKEFLAGS=-j 12"' && \
 	echo 'PKG_LIBS+=-pthread' >> ~/.R/Makevars

RUN R -e 'install.packages("devtools")'
RUN R -e "install.packages('remotes')"
WORKDIR /app
COPY * /app/
RUN R -e "devtools::document()"
RUN R -e "devtools::install()"
RUN yarn install
RUN yarn run build
CMD ["yarn", "run", "start-dev"]
