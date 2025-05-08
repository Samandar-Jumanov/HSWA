FROM cr.weaviate.io/semitechnologies/img2vec-pytorch:resnet50

HEALTHCHECK --interval=10s --timeout=10s --retries=5 --start-period=60s \
  CMD wget --spider -q http://localhost:8080/.well-known/ready || exit 1

EXPOSE 8080