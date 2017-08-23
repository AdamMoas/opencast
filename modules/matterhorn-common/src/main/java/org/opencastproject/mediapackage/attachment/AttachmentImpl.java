/**
 * Licensed to The Apereo Foundation under one or more contributor license
 * agreements. See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 *
 * The Apereo Foundation licenses this file to you under the Educational
 * Community License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License
 * at:
 *
 *   http://opensource.org/licenses/ecl2.txt
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 */

package org.opencastproject.mediapackage.attachment;

import org.opencastproject.mediapackage.AbstractMediaPackageElement;
import org.opencastproject.mediapackage.Attachment;
import org.opencastproject.mediapackage.MediaPackageElementFlavor;
import org.opencastproject.util.Checksum;
import org.opencastproject.util.MimeType;
import org.opencastproject.util.MimeTypes;
import org.opencastproject.util.UnknownFileTypeException;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import javax.xml.bind.annotation.XmlAttribute;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlElementWrapper;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;
import javax.xml.bind.annotation.XmlValue;
import javax.xml.bind.annotation.adapters.XmlAdapter;

/**
 * Basic implementation of an attachment.
 */
@XmlType(name = "attachment", namespace = "http://mediapackage.opencastproject.org")
@XmlRootElement(name = "attachment", namespace = "http://mediapackage.opencastproject.org")
public class AttachmentImpl extends AbstractMediaPackageElement implements Attachment {

  /** Serial version UID */
  private static final long serialVersionUID = 6626531251856698138L;

  /** The object properties */
  @XmlElementWrapper(name = "additionalProperties")
  @XmlElement(name = "property")
  protected List<Property> properties = null;

  /**
   * Needed by JAXB
   */
  public AttachmentImpl() {
    super(Type.Attachment, null, null);
  }

  /**
   * Creates an attachment.
   *
   * @param identifier
   *          the attachment identifier
   * @param flavor
   *          the attachment type
   * @param uri
   *          the attachments location
   * @param size
   *          the attachments size
   * @param checksum
   *          the attachments checksum
   * @param mimeType
   *          the attachments mime type
   */
  protected AttachmentImpl(String identifier, MediaPackageElementFlavor flavor, URI uri, long size, Checksum checksum,
          MimeType mimeType) {
    super(identifier, Type.Attachment, flavor, uri, size, checksum, mimeType);
    if (uri != null)
      try {
        this.setMimeType(MimeTypes.fromURI(uri));
      } catch (UnknownFileTypeException e) { }
  }

  /**
   * Creates an attachment.
   *
   * @param flavor
   *          the attachment type
   * @param uri
   *          the attachment location
   * @param size
   *          the attachment size
   * @param checksum
   *          the attachment checksum
   * @param mimeType
   *          the attachment mime type
   */
  protected AttachmentImpl(MediaPackageElementFlavor flavor, URI uri, long size, Checksum checksum, MimeType mimeType) {
    super(Type.Attachment, flavor, uri, size, checksum, mimeType);
    if (uri != null)
      try {
        this.setMimeType(MimeTypes.fromURI(uri));
      } catch (UnknownFileTypeException e) { }
  }

  /**
   * Creates an attachment.
   *
   * @param identifier
   *          the attachment identifier
   * @param uri
   *          the attachments location
   */
  protected AttachmentImpl(String identifier, URI uri) {
    this(identifier, null, uri, 0, null, null);
  }

  /**
   * Creates an attachment.
   *
   * @param uri
   *          the attachments location
   */
  protected AttachmentImpl(URI uri) {
    this(null, null, uri, 0, null, null);
  }

  /**
   * Creates a new attachment from the url.
   *
   * @param uri
   *          the attachment location
   * @return the attachment
   */
  public static Attachment fromURI(URI uri) {
    return new AttachmentImpl(uri);
  }

  @Override
  public boolean containsProperty(String propertyName) {
    if (properties != null) {
      for (Property property : properties) {
          if (property.key.equals(propertyName)) {
            return true;
          }
      }
    }
    return false;
  }

  @Override
  public HashMap<String, String> getProperties() {
    HashMap<String, String> map = new HashMap();
    if (properties != null) {
      for (Property property : properties) {
        map.put(property.key, property.value);
      }
    }
    return map;
  }

  @Override
  public String getPropertyValue(String propertyName) {
    if (properties != null) {
      for (Property property : properties) {
        if (property.key.equals(propertyName)) {
          return property.value;
        }
      }
    }
    return null;
  }

  @Override
  public void addProperty(String name, String value) {
    if (properties == null) {
      properties = new ArrayList();
    }
    properties.add(new Property(name, value));
  }

  @Override
  public boolean removeProperty(String propertyName) {
    if (properties != null) {
      for (Property property : properties) {
        if (property.key.equals(propertyName)) {
          return properties.remove(property);
        }
      }
    }
    return false;
  }

  @Override
  public void clearProperties() {
    if (properties != null) {
      properties.clear();
      properties = null;
    }
  }

  private static class Property {
    @XmlAttribute(name = "key")
    private String key;
    @XmlValue
    private String value;

    Property() {
      // Default constructor
    }

    Property(String key, String value) {
      this.key = key;
      this.value = value;
    }

    public String getKey() {
      return key;
    }

    public String getValue() {
      return value;
    }
  }

  public static class Adapter extends XmlAdapter<AttachmentImpl, Attachment> {
    public AttachmentImpl marshal(Attachment mp) throws Exception {
      return (AttachmentImpl) mp;
    }

    public Attachment unmarshal(AttachmentImpl mp) throws Exception {
      return mp;
    }
  }
}
