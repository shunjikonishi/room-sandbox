package controllers

import play.api._
import play.api.mvc._
import roomframework.room.RoomManager
import roomframework.room.DefaultRoomFactory
import roomframework.room.echo.EchoRoomFactory

object Application extends Controller {

  def notFound(path: String) = Action {
    NotFound(views.html.index(path))
  }

  val rm = RoomManager(new DefaultRoomFactory() with EchoRoomFactory)

  def ws(path: String) = WebSocket.using[String] { implicit request =>
    Logger.info("WebSocket request: " + path)
    val h = rm.join(path)
    (h.in, h.out)
  }

}