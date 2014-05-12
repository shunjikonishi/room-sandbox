import play.api._
import play.api.libs.concurrent.Akka
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import play.api.mvc._
import play.api.Play.current
import play.api.libs.ws.WS
import scala.concurrent.duration.DurationInt

object Global extends GlobalSettings {

  override def onStart(app: Application) = {
    sys.env.get("POLLING_URL").foreach { url =>
      Akka.system.scheduler.schedule(0 seconds, 50 minutes) {
        WS.url(url).get.map { response =>
          Logger.info("polling: " + url + ", " + response.status)
        }
      }
    }
  } 

  override def onRouteRequest(req: RequestHeader): Option[Handler] = {
    if (req.method == "GET" &&
        req.headers.get("Upgrade").exists(_.equalsIgnoreCase("websocket"))) {
      Some(controllers.Application.ws(req.path))
    } else {
      super.onRouteRequest(req)
    }
  }

}
