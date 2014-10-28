/**
 *  Copyright 2009, 2010 The Regents of the University of California
 *  Licensed under the Educational Community License, Version 2.0
 *  (the "License"); you may not use this file except in compliance
 *  with the License. You may obtain a copy of the License at
 *
 *  http://www.osedu.org/licenses/ECL-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an "AS IS"
 *  BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 *  or implied. See the License for the specific language governing
 *  permissions and limitations under the License.
 *
 */
package org.opencastproject.workflow.handler;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.easymock.EasyMock;
import static org.easymock.EasyMock.verify;
import org.junit.Before;
import org.opencastproject.ingest.api.IngestService;
import org.opencastproject.smil.api.SmilService;
import org.opencastproject.videoeditor.api.VideoEditorService;
import org.opencastproject.workspace.api.Workspace;
import org.junit.Test;
import org.opencastproject.mediapackage.Catalog;
import org.opencastproject.mediapackage.MediaPackage;
import org.opencastproject.mediapackage.MediaPackageBuilder;
import org.opencastproject.mediapackage.MediaPackageBuilderFactory;
import org.opencastproject.mediapackage.MediaPackageElement;
import org.opencastproject.mediapackage.MediaPackageElementFlavor;
import org.opencastproject.mediapackage.MediaPackageException;
import org.opencastproject.mediapackage.Track;
import org.opencastproject.mediapackage.selector.TrackSelector;
import org.opencastproject.smil.impl.SmilServiceImpl;
import org.opencastproject.util.NotFoundException;
import org.opencastproject.workflow.api.WorkflowInstance;
import org.opencastproject.workflow.api.WorkflowInstanceImpl;
import org.opencastproject.workflow.api.WorkflowOperationException;
import org.opencastproject.workflow.api.WorkflowOperationInstance;
import org.opencastproject.workflow.api.WorkflowOperationInstanceImpl;
import org.opencastproject.workflow.api.WorkflowOperationResult;
import org.springframework.util.Assert;

/**
 * Test class for {@link VideoEditorWorkflowOperationHandler}
 */
public class VideoEditorWorkflowOperationHandlerTest {

  private VideoEditorWorkflowOperationHandler videoEditorWorkflowOperationHandler = null;
  private SmilService smilService = null;
  private IngestService ingestServiceMock = null;
  private VideoEditorService videoEditorServiceMock = null;
  private Workspace workspaceMock = null;

  private URI mpURI = null;
  private MediaPackage mp = null;

  @Before
  public void setUp() throws MediaPackageException, IOException,
          NotFoundException, URISyntaxException {

    mpURI = VideoEditorWorkflowOperationHandlerTest.class
            .getResource("/editor_mediapackage.xml").toURI();
    MediaPackageBuilder mpBuilder = MediaPackageBuilderFactory.newInstance()
            .newMediaPackageBuilder();
    mp = mpBuilder.loadFromXml(mpURI.toURL().openStream());
    smilService = new SmilServiceImpl();
    ingestServiceMock = EasyMock.createNiceMock(IngestService.class);
    videoEditorServiceMock = EasyMock.createNiceMock(VideoEditorService.class);
    workspaceMock = EasyMock.createNiceMock(Workspace.class);
    
    videoEditorWorkflowOperationHandler = new VideoEditorWorkflowOperationHandler();
    videoEditorWorkflowOperationHandler.setIngestService(ingestServiceMock);
    videoEditorWorkflowOperationHandler.setSmilService(smilService);
    videoEditorWorkflowOperationHandler.setVideoEditorService(videoEditorServiceMock);
    videoEditorWorkflowOperationHandler.setWorkspace(workspaceMock);
  }

  private static Map<String, String> getDefaultConfiguration() {
    Map<String, String> configuration = new HashMap<String, String>();
    configuration.put("source-flavors", "*/work");
    configuration.put("preview-flavors", "*/preview");
    configuration.put("skipped-flavors", "*/work");
    configuration.put("smil-flavors", "*/smil");
    configuration.put("target-smil-flavor", "episode/smil");
    configuration.put("target-flavor-subtype", "trimmed");
    return configuration;
  }

  private WorkflowInstanceImpl getWorkflowInstance(MediaPackage mp, Map<String, String> configurations) {
    WorkflowInstanceImpl workflowInstance = new WorkflowInstanceImpl();
    workflowInstance.setId(1);
    workflowInstance.setState(WorkflowInstance.WorkflowState.RUNNING);
    workflowInstance.setMediaPackage(mp);
    WorkflowOperationInstanceImpl operation = new WorkflowOperationInstanceImpl("op", WorkflowOperationInstance.OperationState.RUNNING);
    operation.setTemplate("editor");
    operation.setState(WorkflowOperationInstance.OperationState.RUNNING);
    for (String key : configurations.keySet()) {
      operation.setConfiguration(key, configurations.get(key));
    }
    List<WorkflowOperationInstance> operations = new ArrayList<WorkflowOperationInstance>(1);
    operations.add(operation);
    workflowInstance.setOperations(operations);
    return workflowInstance;
  }

  @Test
  public void testEditorOperationStart() throws WorkflowOperationException, IOException {
    // uri for new preview track smil file
    EasyMock.expect(workspaceMock.put(
            (String) EasyMock.anyObject(),
            (String) EasyMock.anyObject(),
            (String) EasyMock.anyObject(),
            (InputStream) EasyMock.anyObject()))
            .andReturn(URI.create("http://localhost:8080/foo/presenter.smil"));

    // uri for new episode smil file
    String episodeSmilUri = "http://localhost:8080/foo/episode.smil";
    EasyMock.expect(workspaceMock.put(
            (String) EasyMock.anyObject(),
            (String) EasyMock.anyObject(),
            (String) EasyMock.anyObject(),
            (InputStream) EasyMock.anyObject()))
            .andReturn(URI.create(episodeSmilUri));
    EasyMock.replay(workspaceMock);
    WorkflowInstanceImpl workflowInstance = getWorkflowInstance(mp, getDefaultConfiguration());

    WorkflowOperationResult result = videoEditorWorkflowOperationHandler.start(workflowInstance, null);
    Assert.notNull(result, "VideoEditor workflow operation returns null but should be an instantiated WorkflowOperationResult");
    verify(workspaceMock);

    WorkflowOperationInstance worflowOperationInstance = workflowInstance.getCurrentOperation();
    String smillFlavorsProperty = worflowOperationInstance.getConfiguration("smil-flavors");
    String previewFlavorsProperty = worflowOperationInstance.getConfiguration("preview-flavors");
    MediaPackageElementFlavor smilFlavor = MediaPackageElementFlavor.parseFlavor(smillFlavorsProperty);
    MediaPackageElementFlavor previewFlavor = MediaPackageElementFlavor.parseFlavor(previewFlavorsProperty);

    // each preview track (e.g. presenter/preview) should have an own smil catalog in media package
    Catalog[] previewSmilCatalogs = result.getMediaPackage().getCatalogs(new MediaPackageElementFlavor("presenter", "smil"));
    Assert.notEmpty(previewSmilCatalogs);
    for (Track track : result.getMediaPackage().getTracks()) {
      if (track.getFlavor().matches(previewFlavor)) {
        boolean SmilCatalogFound = false;
        MediaPackageElementFlavor trackSmilFlavor = new MediaPackageElementFlavor(
          track.getFlavor().getType(),
          smilFlavor.getSubtype());
        for (Catalog previewSmilCatalog : previewSmilCatalogs) {
          if (previewSmilCatalog.getFlavor().matches(trackSmilFlavor)) {
            SmilCatalogFound = true;
            break;
          }
        }
        Assert.isTrue(SmilCatalogFound, 
                "Mediapackage doesn't contain a smil catalog with flavor " + trackSmilFlavor.toString());
      }
    }

    // an "target-smil-flavor catalog" schould be in media package
    String targetSmilFlavorProperty = worflowOperationInstance.getConfiguration("target-smil-flavor");
    Catalog[] episodeSmilCatalogs = result.getMediaPackage().getCatalogs(MediaPackageElementFlavor.parseFlavor(targetSmilFlavorProperty));
    Assert.notEmpty(episodeSmilCatalogs,
            "Mediapackage should contain catalog with flavor " + targetSmilFlavorProperty);
    Assert.isTrue(episodeSmilCatalogs[0].getURI().compareTo(URI.create(episodeSmilUri)) == 0,
            "Target smil catalog URI does not match");
  }

  @Test
  public void testEditorOperationSkip() throws WorkflowOperationException {
    WorkflowInstanceImpl workflowInstance = getWorkflowInstance(mp, getDefaultConfiguration());
    WorkflowOperationResult result = videoEditorWorkflowOperationHandler.skip(workflowInstance, null);
    Assert.notNull(result, "VideoEditor workflow operation returns null but should be an instantiated WorkflowOperationResult");

    // mediapackage should contain new derived track with flavor given by "target-flavor-subtype" configuration
    WorkflowOperationInstance worflowOperationInstance = workflowInstance.getCurrentOperation();
    String targetFlavorSubtypeProperty = worflowOperationInstance.getConfiguration("target-flavor-subtype");
    String skippedFlavorsProperty = worflowOperationInstance.getConfiguration("skipped-flavors");

    TrackSelector trackSelector = new TrackSelector();
    trackSelector.addFlavor(skippedFlavorsProperty);
    Collection<Track> skippedTracks = trackSelector.select(result.getMediaPackage(), false);
    Assert.notEmpty(skippedTracks, "Mediapackage does not contain any tracks matching flavor " + skippedFlavorsProperty);

    for (Track skippedTrack : skippedTracks) {
      MediaPackageElementFlavor derivedTrackFlavor = MediaPackageElementFlavor.flavor(
              skippedTrack.getFlavor().getType(), targetFlavorSubtypeProperty);
      MediaPackageElement[] derivedElements = result.getMediaPackage().getDerived(
              skippedTrack, derivedTrackFlavor);
      Assert.notEmpty(derivedElements, "Media package should contain track with flavor " + derivedTrackFlavor.toString());
    }
  }

  @Test
  public void testEditorOperationSkipWithModifiedSkippedFlavorsAndTargetFlavorProperty() throws WorkflowOperationException {
    Map<String, String> configuration = getDefaultConfiguration();
    configuration.put("skipped-flavors", "*/preview");
    configuration.put("target-flavor-subtype", "edited");
    WorkflowInstanceImpl workflowInstance = getWorkflowInstance(mp, configuration);
    WorkflowOperationResult result = videoEditorWorkflowOperationHandler.skip(workflowInstance, null);
    Assert.notNull(result, "VideoEditor workflow operation returns null but should be an instantiated WorkflowOperationResult");

    // mediapackage should contain new derived track with flavor given by "target-flavor-subtype" configuration
    WorkflowOperationInstance worflowOperationInstance = workflowInstance.getCurrentOperation();
    String targetFlavorSubtypeProperty = worflowOperationInstance.getConfiguration("target-flavor-subtype");
    String skippedFlavorsProperty = worflowOperationInstance.getConfiguration("skipped-flavors");

    TrackSelector trackSelector = new TrackSelector();
    trackSelector.addFlavor(skippedFlavorsProperty);
    Collection<Track> skippedTracks = trackSelector.select(result.getMediaPackage(), false);
    Assert.notEmpty(skippedTracks, "Mediapackage does not contain any tracks matching flavor " + skippedFlavorsProperty);

    for (Track skippedTrack : skippedTracks) {
      MediaPackageElementFlavor derivedTrackFlavor = MediaPackageElementFlavor.flavor(
              skippedTrack.getFlavor().getType(), targetFlavorSubtypeProperty);
      MediaPackageElement[] derivedElements = result.getMediaPackage().getDerived(
              skippedTrack, derivedTrackFlavor);
      Assert.notEmpty(derivedElements, "Media package should contain track with flavor " + derivedTrackFlavor.toString());
      Assert.isTrue(derivedElements[0].getFlavor().getSubtype().equals(targetFlavorSubtypeProperty),
              "Mediapackage schould contain a derived track with flavor subtype " + targetFlavorSubtypeProperty);
    }
  }
}
