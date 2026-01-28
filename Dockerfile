# Create MongoDB Image
FROM mongo:5.0.25
    
COPY priv/docker-entrypoint-initdb.d/* /docker-entrypoint-initdb.d

EXPOSE 27017