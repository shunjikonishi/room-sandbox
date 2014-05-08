package controllers

import play.api._
import play.api.mvc._
import roomframework.room._

object Application extends Controller {

  def notFound(path: String) = Action {
    NotFound(views.html.index(path))
  }

  def ws(path: String) = WebSocket.using[String] { implicit request =>
    Logger.info("WebSocket request: " + path)
    val h = rm.join(path)
    (h.in, h.out)
  }

  val rm = RoomManager(new EchoRoomFactory())

  class EchoRoomFactory extends RoomFactory {
    def createRoom(name: String) = new DefaultRoom(name)
    override def createHandler(room: Room) = new EchoRoomHandler(room)
  }

  class EchoRoomHandler(room: Room) extends RoomHandler(room) {
    override protected def handleMessage(msg: String): Unit = {
      room.channel.send(msg)
    }
  }

}