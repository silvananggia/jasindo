# Gunakan image dasar dari MariaDB 10.2.x
FROM mariadb:10.2

# Set password untuk root user
ENV MYSQL_ROOT_PASSWORD=rootpassword

# Mengatur volume untuk menyimpan data MariaDB secara persisten
VOLUME /var/lib/mysql

# Mengekspos port default MariaDB
EXPOSE 3306

# Memulai MariaDB
CMD ["mysqld"]
