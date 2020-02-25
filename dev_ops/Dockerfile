FROM ubuntu:18.04

# update apt and ibstall essentials 
RUN apt-get update && apt-get install jq curl sudo nano git vim ffmpeg build-essential -y

# install node
RUN curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -
RUN apt-get install -y nodejs

# install pm2 
RUN npm install pm2 -g

# installing the ftdi drivers
RUN mkdir ftdi
# get the file from https://www.ftdichip.com/Drivers/D2XX.htm
RUN curl https://www.ftdichip.com/Drivers/D2XX/Linux/libftd2xx-x86_64-1.4.8.gz -o /ftdi/libftd2xx-x86_64-1.4.8.gz
RUN tar xfvz /ftdi/libftd2xx-x86_64-1.4.8.gz -C /ftdi
RUN cp /ftdi/release/build/lib* /usr/local/lib || :
RUN ln -s /usr/local/lib/libftd2xx.so.1.4.8 /usr/local/lib/libftd2xx.so
RUN chmod 0755 /usr/local/lib/libftd2xx.so
RUN cp /ftdi/release/*.h /usr/local/include/
RUN rm -fr ftdi
RUN /sbin/ldconfig -v

# args
ARG USER=dhamma
ARG PW=123456
ARG UID=1000

# Adding a user (dhamma is used here, but can be everything)
RUN useradd -m ${USER} --uid=${UID} && echo "${USER}:${PW}" | chpasswd
RUN usermod -aG sudo ${USER}

COPY ./docker_init.sh /home/${USER}
RUN chmod +x /home/${USER}/docker_init.sh
RUN chown ${USER}:${USER} /home/${USER}/docker_init.sh

# switch to this user
USER ${USER}
WORKDIR /home/${USER}

ENV PW=${PW}
ENV USER=${USER}

CMD [ "sh" , "-c" , "./docker_init.sh $USER $PW true" ]
