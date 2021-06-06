module Main exposing (..)

import Array exposing (Array)
import Browser
import Ext.Browser
import Ext.Browser.Navigation
import Html exposing (Html, a, div, input, p, text, textarea)
import Html.Attributes exposing (class, href, placeholder, style)
import Html.Events exposing (onInput)
import Html.Keyed
import Task
import Time
import Url


main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


type alias Flags =
    { spaFlags : Ext.Browser.Navigation.SpaFlags
    }


type alias Model =
    { bootAt : Maybe Time.Posix
    , paragraphs : Array String
    , navKey : Ext.Browser.Navigation.Key
    , url : Url.Url
    }


type Msg
    = TimeInput Time.Posix
    | UserInput Int String
    | OnUrlRequest Ext.Browser.UrlRequest
    | OnUrlChange Url.Url


init : Flags -> ( Model, Cmd Msg )
init flags =
    let
        { url, navKey } =
            Ext.Browser.Navigation.spaFlags flags
    in
    ( { bootAt = Nothing
      , paragraphs = Array.fromList [ "" ]
      , url = url
      , navKey = navKey
      }
    , Task.perform TimeInput Time.now
    )


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ Ext.Browser.Navigation.onUrlRequest OnUrlRequest
        , Ext.Browser.Navigation.onUrlChange OnUrlChange
        ]


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        OnUrlRequest (Ext.Browser.Internal url) ->
            ( model
            , Ext.Browser.Navigation.pushUrl model.navKey (Url.toString url)
            )

        OnUrlRequest (Ext.Browser.External urlString) ->
            ( model
            , Ext.Browser.Navigation.load urlString
            )

        OnUrlChange url ->
            ( { model | url = url }
            , Cmd.none
            )

        TimeInput now ->
            ( { model | bootAt = Just now }
            , Cmd.none
            )

        UserInput index newContent ->
            let
                numOfPara =
                    Array.length model.paragraphs

                newParagraphs =
                    if newContent /= "" && index + 1 == numOfPara then
                        Array.push "" model.paragraphs
                            |> Array.set index newContent

                    else
                        Array.set index newContent model.paragraphs
            in
            ( { model | paragraphs = newParagraphs }
            , Ext.Browser.setPageTitle ("Paragraphs: " ++ String.fromInt (Array.length model.paragraphs))
            )


view : Model -> Html Msg
view model =
    div []
        [ div [ class "m-8 md:m-32" ]
            [ div []
                [ text "Nav links: "
                , a [ href "/one" ] [ text "one" ]
                , text " | "
                , a [ href "/two" ] [ text "two" ]
                , text " | "
                , a [ href "/three" ] [ text "three" ]
                ]
            , Ext.Browser.style [] [ text "a { font-style: italic; }" ]
            , text ("Current url: " ++ Url.toString model.url)
            , div [ class "grid grid-flow-row grid-cols-1 md:grid-cols-2 gap-4" ]
                (Array.indexedMap userInputArea model.paragraphs
                    |> Array.toList
                    |> List.concat
                )
            ]
        ]


userInputArea : Int -> String -> List (Html Msg)
userInputArea index string =
    [ textarea
        [ onInput (UserInput index)
        , class "p-2 w-80 h-32 border-2 rounded"
        , placeholder "write something..."
        ]
        []
    , p [] [ text string ]
    ]
