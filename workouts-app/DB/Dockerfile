FROM postgres:15-alpine

# Set environment variables
ENV POSTGRES_DB=workouts_db
ENV POSTGRES_USER=workouts_user
ENV POSTGRES_PASSWORD=workouts_password

# Copy any initialization scripts if needed
# COPY ./init.sql /docker-entrypoint-initdb.d/

# Expose port
EXPOSE 5432

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD pg_isready -U $POSTGRES_USER -d $POSTGRES_DB




