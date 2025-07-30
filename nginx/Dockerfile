FROM nginx:1.25-alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create SSL directory for certificates that will be mounted at runtime
RUN mkdir -p /etc/nginx/ssl

# Expose ports
EXPOSE 80
EXPOSE 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
