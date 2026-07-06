FROM eclipse-temurin:17-jre
VOLUME /tmp
COPY target/*-1.0.0.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar"]
