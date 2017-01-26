Infrastructure Notes
=======================================================

This page contains notes about the current configuration of the Opencast servers around the world

Harvard DCE
-----------

### Common Configuration Choices

- Unattended upgrade
- CentOS Linux release 7.x

#### nexus.dcex.harvard.edu

- Using [packaged Nexus](https://copr.fedorainfracloud.org/coprs/lkiesow/nexus-oss/)


SWITCH
------

### Common Configuration Choices

- Unattended upgrade
- CentOS Linux release 7.x

#### opencast-nexus.ethz.ch 

- RHEL 7.x
- Using [packaged Nexus](https://copr.fedorainfracloud.org/coprs/lkiesow/nexus-oss/)

#### Test Cluster (*.oc-test.switch.ch)

- Rebuilt weekly via cron + shell, manual branch selection


University of Osnabrück 
-----------------------

### Common Configuration Choices

- Unattended upgrade
- Scientific Linux 7.x

#### build.opencast.org

- Builds are triggered by cron, manual branch selection currently

#### docs.opencast.org

- Rebuild every 5 minutes via bitbucket webhook, nightly rebuild

#### nexus.virtuos.uos.de

- Using [packaged Nexus](https://copr.fedorainfracloud.org/coprs/lkiesow/nexus-oss/)

#### octestallinone.virtuos.uos.de

- Using packaged Opencast

#### pullrequests.opencast.org

- Merge ticket list needs to set manually

#### repo.opencast.org and pullrequests.opencast.org

- Scientific Linux 6.x


University of Saskatchewean
---------------------------

### Common Configuration Choices

- Debian 8.x
- Unattended upgrades

### Testing Cluster (test*.usask.ca)

- Using Debian packages for Opencast
- Nightly reset and upgrade

### oc-cache.usask.ca

- Using [Docker Nexus](https://hub.docker.com/r/lkiesow/opencast-nexus-oss/)
